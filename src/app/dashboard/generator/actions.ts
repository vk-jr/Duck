'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logWorkflow } from '@/lib/workflow-logger'
import { createClient as createBaseClient } from '@/lib/supabase/client'

export async function getWorkflowLog(id: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('workflow_logs')
        .select('*')
        .eq('id', id)
        .single()
    if (error) return null
    return data
}

export async function generateImage(formData: FormData) {
    const supabase = await createClient()

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        // Log unauthorized attempt if possible, though we might not have a client to log with if we want to be strict, 
        // but here we can try logging with service role if we really wanted. 
        // For now, just return error as before, or log it.
        return { error: 'Unauthorized' }
    }

    // Initialize Admin Client for Logging
    const adminSupabase = await createServiceRoleClient()

    // 2. Get Form Data
    const prompt = formData.get('prompt') as string
    const brandId = formData.get('brand_id') as string // We need to fetch this from context or selection
    const generationType = formData.get('generation_type') as string || 'generation'

    if (!prompt) return { error: 'Prompt is required' }

    // 3. Create a "Placeholder" Row in Supabase
    // This allows us to track the status immediately and gives us an ID to pass to n8n
    // NOTE: We assume the user has a brand. For now, we'll fetch the first brand or require it.

    // Fetch user's brand (Assuming 1 brand for now)
    let activeBrandId = brandId
    if (!activeBrandId) {
        const { data: profile } = await supabase.from('profiles').select('brand_id').eq('id', user.id).single()
        if (profile?.brand_id) {
            activeBrandId = profile.brand_id
        } else {
            // Fallback: Check if they own any brand
            const { data: brand } = await supabase.from('brands').select('id').eq('created_by', user.id).single()
            if (brand) activeBrandId = brand.id
        }
    }

    if (!activeBrandId) {
        await logWorkflow(adminSupabase, {
            workflowName: 'image_generation',
            statusCode: 404,
            category: 'CLIENT_ERROR',
            message: 'No brand found',
            userId: user.id
        })
        return { error: 'No brand found. Please create a brand first.' }
    }

    const { data: insertedImage, error: dbError } = await supabase
        .from('generated_images')
        .insert({
            brand_id: activeBrandId,
            user_prompt: prompt,
            status: 'generating',
            created_by: user.id
        })
        .select()
        .single()

    if (dbError) {
        console.error('DB Insert Error:', dbError)
        await logWorkflow(adminSupabase, {
            workflowName: 'image_generation',
            statusCode: 500,
            category: 'DB_ERROR',
            message: 'Failed to start generation record',
            details: dbError,
            userId: user.id,
            brandId: activeBrandId
        })
        return { error: 'Failed to start generation record.' }
    }

    // 4. Call n8n Webhook
    // We pass the prompt AND the `generated_image_id` so n8n can update THIS specific row.
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATION
    if (!webhookUrl) {
        await logWorkflow(adminSupabase, {
            workflowName: 'image_generation',
            statusCode: 500,
            category: 'CONFIG_ERROR',
            message: 'Webhook URL not configured',
            userId: user.id,
            brandId: activeBrandId,
            executionStatus: 'ERROR'
        })
        return { error: 'Webhook URL not configured' }
    }

    // Initiate Workflow Log
    const logEntry = await logWorkflow(adminSupabase, {
        workflowName: 'image_generation',
        statusCode: 202,
        category: 'SUCCESS',
        message: 'Image Generation Initiated',
        userId: user.id,
        brandId: activeBrandId,
        metadata: { image_id: insertedImage.id, prompt: prompt },
        executionStatus: 'PENDING'
    })

    try {
        // Sending as POST body.
        // Make sure your n8n Webhook node is set to "POST" and "JSON".
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                image_id: insertedImage.id, // THE KEY: n8n should use this to Update the row
                brand_id: activeBrandId,
                user_id: user.id,
                log_id: logEntry?.id, // Pass Log ID
                metadata: {
                    type: generationType,
                    log_id: logEntry?.id
                }
            })
        })

        if (!response.ok) {
            throw new Error(`Webhook failed: ${response.statusText}`)
        }
    } catch (err) {
        console.error('Webhook Error:', err)
        // Optional: Update status to failed
        await supabase.from('generated_images').update({ status: 'failed' }).eq('id', insertedImage.id)

        await logWorkflow(adminSupabase, {
            workflowName: 'image_generation',
            statusCode: 502,
            category: 'API_ERROR',
            message: 'Failed to trigger AI agent',
            details: err,
            userId: user.id,
            brandId: activeBrandId,
            metadata: { image_id: insertedImage.id },
            executionStatus: 'ERROR'
        })
        return { error: 'Failed to trigger AI agent.' }
    }

    // Success Log - Optional, or we can just leave it as PENDING for N8N to finish.
    // If we want to mark "Hand off success", we can log another entry or update logic (future).
    // For now, removing the explicit "Success" log at the end as per the new pattern of "Pending -> N8N updates".

    revalidatePath('/dashboard/generator')
    return { success: true, imageId: insertedImage.id, logId: logEntry?.id }
}
