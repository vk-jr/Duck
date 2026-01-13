'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logWorkflow } from '@/lib/workflow-logger'

export async function getBrands() {
    const supabase = await createClient()

    // Fetch brands from the 'brands' table. 
    // Adapting to existing schema or falling back to empty list if table structure is different
    try {
        const { data, error } = await supabase
            .from('brands')
            .select('id, name')

        if (error) {
            console.error('Error fetching brands:', error)
            return []
        }

        return data || []
    } catch (e) {
        console.error('Exception fetching brands:', e)
        return []
    }
}

export async function getQualityCheck(id: string) {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('quality_checks')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching quality check:', error)
            return null
        }

        return data
    } catch (e) {
        console.error('Exception fetching quality check:', e)
        return null
    }
}

export async function getUserAssets() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { images: [], layers: [] }

    // Fetch Generated Images
    const { data: images } = await supabase
        .from('generated_images')
        .select('*')
        .eq('created_by', user.id)
        .eq('status', 'Generated') // Case sensitive? 'generated' or 'Generated'. Checks previous code used 'Generated' in Gallery page, but actions used 'generating'. Assuming 'generated' or 'Generated'.
        .order('created_at', { ascending: false })
        .limit(20)

    // Fetch Image Layers
    const { data: layers } = await supabase
        .from('image_layers')
        .select('*')
        .eq('user_id', user.id)
        // .eq('status', 'generated') // Simplified check
        .order('created_at', { ascending: false })
        .limit(20)

    return { images: images || [], layers: layers || [] }
}

export async function createQualityCheck(formData: FormData) {
    const supabase = await createClient()

    const brandId = formData.get('brandId') as string
    const file = formData.get('image') as File
    const existingImageUrl = formData.get('imageUrl') as string

    if (!file && !existingImageUrl) {
        return { success: false, error: 'No file uploaded or selected' }
    }

    try {
        const user = await supabase.auth.getUser()
        const userId = user.data.user?.id

        if (!userId) {
            return { success: false, error: 'User not authenticated' }
        }

        // 1. Upload Image to Storage
        let publicUrl = existingImageUrl

        if (file) {
            // 1. Upload Image to Storage (Only if file provided)
            const fileExt = file.name.split('.').pop()
            const fileName = `${userId}/${Date.now()}.${fileExt}`
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('images')
                .upload(fileName, file)

            if (uploadError) {
                console.error('Upload error:', uploadError)
                return { success: false, error: 'Failed to upload image' }
            }

            const { data } = supabase
                .storage
                .from('images')
                .getPublicUrl(fileName)

            publicUrl = data.publicUrl
        }

        // Use service role for logging
        const adminSupabase = await createServiceRoleClient()

        // 2. Save to Database with status 'generating'
        const { data: insertData, error: insertError } = await supabase
            .from('quality_checks')
            .insert({
                user_id: userId,
                brand_id: brandId || null,
                image_url: publicUrl,
                status: 'generating',
                result: null
            })
            .select()
            .single()

        if (insertError) {
            console.error('Database insert error:', insertError)
            await logWorkflow(adminSupabase, {
                workflowName: 'quality_check_create',
                statusCode: 500,
                category: 'DB_ERROR',
                message: 'Failed to save check result',
                details: insertError,
                userId: userId,
                brandId: brandId
            })
            return { success: false, error: 'Failed to save check result' }
        }

        // 3. Call Webhook
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATION
        if (!webhookUrl) {
            console.warn('Webhook URL not configured')
            await logWorkflow(adminSupabase, {
                workflowName: 'quality_check_create',
                statusCode: 500,
                category: 'CONFIG_ERROR',
                message: 'Webhook URL not configured',
                userId: userId,
                brandId: brandId
            })
            return { success: true, data: insertData }
        }

        // Don't await webhook to keep UI snappy, or do await if we want to ensure it sent
        // User asked to "send to the same web book with a type 'check'"
        const webhookBody = {
            id: insertData.id, // check ID
            image_url: publicUrl,
            brand_id: brandId,
            user_id: userId,
            metadata: {
                type: 'check'
            }
        }

        // Fire and forget, or await? Usually safer to await at least the initiation
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookBody)
        })

        // Success Log
        await logWorkflow(adminSupabase, {
            workflowName: 'quality_check_create',
            statusCode: 200,
            category: 'SUCCESS',
            message: 'Quality Check Triggered',
            userId: userId,
            brandId: brandId,
            metadata: { check_id: insertData.id }
        })

        revalidatePath('/dashboard/quality-checker/check')
        return { success: true, data: insertData }

    } catch (e) {
        console.error('Unexpected error:', e)
        // We might not have adminSupabase here if it failed early, so we try creating it if possible or skip logging
        try {
            const adminSupabase = await createServiceRoleClient()
            await logWorkflow(adminSupabase, {
                workflowName: 'quality_check_create',
                statusCode: 500,
                category: 'API_ERROR',
                message: 'Unexpected error in quality check creation',
                details: e,
            })
        } catch (_) { }

        return { success: false, error: 'An unexpected error occurred' }
    }
}

export async function generateBrandGuidelines(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = await createServiceRoleClient()

    // 1. Auth & Validation
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    const brandId = formData.get('brandId') as string
    const file = formData.get('image') as File
    const instructions = formData.get('instructions') as string

    if (!file) return { success: false, error: 'No reference image uploaded' }
    if (!brandId) return { success: false, error: 'Brand is required' }

    try {
        // 2. Upload Image
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_ref.${fileExt}`
        const { error: uploadError } = await supabase
            .storage
            .from('images')
            .upload(fileName, file)

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return { success: false, error: 'Failed to upload reference image' }
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('images')
            .getPublicUrl(fileName)

        // 3. Update Brand Record with Inputs (as requested)
        const { error: updateError } = await supabase
            .from('brands')
            .update({
                reference_image_url: publicUrl,
                guideline_instructions: instructions
            })
            .eq('id', brandId)

        if (updateError) {
            console.error('Brand Update Error:', updateError)
        }

        // 4. Call Webhook
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATION
        if (!webhookUrl) {
            await logWorkflow(adminSupabase, {
                workflowName: 'brand_guidelines',
                statusCode: 500,
                category: 'CONFIG_ERROR',
                message: 'Webhook URL not configured',
                userId: user.id,
                brandId: brandId
            })
            return { success: false, error: 'Webhook URL not configured' }
        }

        // Generate a temporary ID since we aren't saving to generated_images
        const tempId = crypto.randomUUID()

        const webhookBody = {
            prompt: instructions,
            image_id: tempId,
            brand_id: brandId,
            user_id: user.id,
            metadata: {
                type: 'brand_guide',
                reference_image_url: publicUrl
            }
        }

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookBody)
        })

        if (!response.ok) {
            throw new Error(`Webhook failed: ${response.statusText}`)
        }

        // Success
        await logWorkflow(adminSupabase, {
            workflowName: 'brand_guidelines',
            statusCode: 200,
            category: 'SUCCESS',
            message: 'Brand Guidelines Generation Triggered',
            userId: user.id,
            brandId: brandId,
            metadata: { temp_id: tempId }
        })

        revalidatePath('/dashboard/quality-checker/create')
        return { success: true, data: { id: tempId, status: 'sent_to_webhook' } }

    } catch (e) {
        console.error('Action error:', e)
        await logWorkflow(adminSupabase, {
            workflowName: 'brand_guidelines',
            statusCode: 502,
            category: 'API_ERROR',
            message: 'Failed to start generation',
            details: e,
            userId: user.id,
            brandId: brandId
        })
        return { success: false, error: 'Failed to start generation' }
    }
}
