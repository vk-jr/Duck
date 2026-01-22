'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { logWorkflow } from '@/lib/workflow-logger'

export async function createSegmentation(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = await createServiceRoleClient()

    const file = formData.get('image') as File
    const segmentCount = parseInt(formData.get('segmentCount') as string)

    if (!file) return { success: false, error: 'No file uploaded' }
    if (isNaN(segmentCount) || segmentCount < 2 || segmentCount > 8) {
        return { success: false, error: 'Invalid segment count (must be 2-8)' }
    }

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'Unauthorized' }

        // 1. Upload Image
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_seg.${fileExt}`
        const { error: uploadError } = await supabase
            .storage
            .from('uploaded_images')
            .upload(fileName, file)

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return { success: false, error: 'Failed to upload image' }
        }

        const { data: { publicUrl } } = supabase
            .storage
            .from('uploaded_images')
            .getPublicUrl(fileName)

        // 2. Insert into Database
        const { data: insertData, error: insertError } = await supabase
            .from('segmentations')
            .insert({
                user_id: user.id,
                input_image_url: publicUrl,
                segment_count: segmentCount,
                status: 'generating', // Initial status
                output_images: []
            })
            .select()
            .single()

        if (insertError) {
            console.error('DB Insert Error:', insertError)
            return { success: false, error: 'Failed to save segmentation request' }
        }

        // 3. Initiate Workflow Log
        const logEntry = await logWorkflow(adminSupabase, {
            workflowName: 'segmentation',
            statusCode: 202,
            category: 'SUCCESS',
            message: 'Segmentation Initiated',
            userId: user.id,
            metadata: {
                segmentation_id: insertData.id,
                segment_count: segmentCount
            },
            executionStatus: 'PENDING'
        })

        // 4. Trigger Webhook
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATION
        if (!webhookUrl) {
            console.error('Webhook URL is missing. Check NEXT_PUBLIC_N8N_WEBHOOK_GENERATION')

            // Update status to failed so UI stops processing
            await supabase.from('segmentations').update({ status: 'failed_config' }).eq('id', insertData.id)

            await logWorkflow(adminSupabase, {
                workflowName: 'segmentation',
                statusCode: 500,
                category: 'CONFIG_ERROR',
                message: 'Webhook URL not configured',
                userId: user.id,
                executionStatus: 'ERROR'
            })
            return { success: false, error: 'Configuration Error: Webhook URL missing in .env' }
        }

        const webhookBody = {
            segmentation_id: insertData.id,
            image_url: publicUrl,
            segment_count: segmentCount,
            user_id: user.id,
            log_id: logEntry?.id,
            type: 'qwen',
            metadata: {
                type: 'qwen',
                log_id: logEntry?.id
            }
        }

        // Await the webhook call to ensure it's sent
        try {
            console.log('Triggering Webhook:', webhookUrl)
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(webhookBody)
            })

            if (!response.ok) {
                console.error(`Webhook failed: ${response.status} ${response.statusText}`)
                // Update status to failed
                await supabase.from('segmentations').update({ status: 'failed' }).eq('id', insertData.id)
                return { success: false, error: 'Failed to trigger processing workflow' }
            }
        } catch (fetchError) {
            console.error('Webhook Fetch Error:', fetchError)
            // Update status to failed
            await supabase.from('segmentations').update({ status: 'failed' }).eq('id', insertData.id)
            return { success: false, error: 'Failed to connect to processing service' }
        }

        revalidatePath('/dashboard/segment')
        return { success: true, data: insertData, logId: logEntry?.id }

    } catch (e) {
        console.error('Unexpected error:', e)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

export async function getSegmentations() {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data, error } = await supabase
            .from('segmentations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            console.error('Error fetching segmentations:', error)
            return []
        }

        return data || []
    } catch (e) {
        console.error('Exception fetching segmentations:', e)
        return []
    }
}

export async function getSegmentation(id: string) {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('segmentations')
            .select('*')
            .eq('id', id)
            .single()

        if (error) return null
        return data
    } catch (e) {
        return null
    }
}
