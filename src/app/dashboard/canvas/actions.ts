'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ProcessCanvasParams {
    imageId: string
    imageUrl: string
    brandId?: string
    text: string
    type: string
    rectangle?: number[]
}

import { logWorkflow } from '@/lib/workflow-logger'
import { createClient as createBaseClient } from '@/lib/supabase/client'

export async function getWorkflowLog(id: string) {
    const supabase = await createBaseClient()
    const { data, error } = await supabase
        .from('workflow_logs')
        .select('*')
        .eq('id', id)
        .single()
    if (error) return null
    return data
}

export async function processCanvasImage({ imageId, imageUrl, brandId, text, type, rectangle }: ProcessCanvasParams) {
    // Use service role client to bypass RLS policies for insertion
    const supabase = await createServiceRoleClient()
    // const { data: { user } } = await supabase.auth.getUser() // Removed to avoid collision

    // Note: getSession or getUser might fail with service role if not explicitly passed a token?
    // Actually, service role has admin privileges. BUT `auth.getUser()` reads the cookie.
    // If we use service role client, we don't necessarily have the user context attached unless we set it.
    // BUT wait. `createServerClient` with service role key STILL reads cookies? 
    // Yes, the implementation I added reads cookies. 
    // However, usually service role client is used for "Admin" tasks.
    // If `auth.getUser()` fails, we might still be able to insert if we have the user ID.
    // But we need `user.id` for the logic.

    // Let's create TWO clients. 
    // 1. Standard client to get the User.
    // 2. Service client to Insert.

    const standardSupabase = await createClient()
    const { data: { user: standardUser } } = await standardSupabase.auth.getUser()

    if (!standardUser) {
        return { error: 'Unauthorized' }
    }

    const user = standardUser // Alias it back

    // Service role for logging
    const adminSupabase = await createServiceRoleClient()

    // 1. Resolve Brand ID
    let activeBrandId = brandId
    if (!activeBrandId) {
        // Try getting it from the image (if it's a generated image)
        const { data: image } = await supabase
            .from('generated_images')
            .select('brand_id')
            .eq('id', imageId)
            .single()

        if (image?.brand_id) {
            activeBrandId = image.brand_id
        } else {
            // Fallback: Check if user has a brand profile
            const { data: profile } = await standardSupabase.from('profiles').select('brand_id').eq('id', user.id).single()
            if (profile?.brand_id) {
                activeBrandId = profile.brand_id
            }
        }
    }

    if (!activeBrandId) {
        // Fallback: Try to get ANY brand from the brands table to satisfy the NOT NULL constraint on generated_images
        const { data: anyBrand } = await supabase
            .from('brands')
            .select('id')
            .limit(1)
            .single()

        if (anyBrand) {
            activeBrandId = anyBrand.id
        }
    }

    if (!activeBrandId) {
        // Log a warning but proceed, as Brand ID is no longer mandatory
        console.warn('Proceeding without Brand ID for canvas processing')

        // Ensure activeBrandId is null if undefined, for DB compatibility if needed
        // (though undefined usually works if optional in input, but explicit null is safer for SQL)
        // activeBrandId is already let variable.
    }

    // 2. Handle Data URL (Upload to Storage if needed)
    // If exact flow: Upload Image -> Data URL -> Canvas -> Segment -> (Here) -> Storage -> Webhook
    if (imageUrl.startsWith('data:image')) {
        try {
            // Extract content type and base64 data
            // data:image/png;base64,.....
            const matches = imageUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/)
            if (matches && matches.length === 3) {
                const fileExt = matches[1]
                const base64Data = matches[2]
                const buffer = Buffer.from(base64Data, 'base64')

                const fileName = `${user.id}/${Date.now()}_canvas_upload.${fileExt}`

                // Upload to 'uploaded_images' bucket (same as Quality Checker)
                const { error: uploadError } = await supabase
                    .storage
                    .from('uploaded_images')
                    .upload(fileName, buffer, {
                        contentType: `image/${fileExt}`,
                        upsert: true
                    })

                if (uploadError) {
                    console.error('Canvas Upload Error:', uploadError)
                    // Fallback? If upload fails, we might hard fail or just try processing (which might fail if N8N can't reach Data URL)
                    // Let's log and error out to be safe
                    await logWorkflow(adminSupabase, {
                        workflowName: 'canvas_processing',
                        statusCode: 500,
                        category: 'API_ERROR',
                        message: 'Failed to upload canvas image to storage',
                        details: uploadError,
                        userId: user.id
                    })
                    return { error: 'Failed to upload image to storage.' }
                }

                // Get Public URL
                const { data: publicUrlData } = supabase
                    .storage
                    .from('uploaded_images')
                    .getPublicUrl(fileName)

                // UPDATE imageUrl variable to the new remote URL
                imageUrl = publicUrlData.publicUrl
            }
        } catch (e) {
            console.error('Data URL Processing Error:', e)
            return { error: 'Failed to process uploaded image.' }
        }
    }

    // 4. Prepare for DB Insert
    // Ensure Brand ID is null if empty string (fixes UUID mismatch "")
    const dbBrandId = activeBrandId || null

    // Ensure generated_image_id is a valid UUID
    // If imageId comes from an uploaded node (e.g. "upload-123"), it won't be a UUID.
    // User requested to "generate a random one" in this case.
    let dbImageId = imageId
    let isNewUpload = false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(imageId)) {
        dbImageId = crypto.randomUUID()
        isNewUpload = true
    }
    // Ensure parent generated_image exists (FK link)
    // Quality Checks / Brand Images are valid UUIDs but not in generated_images table.
    // We must promote them to generated_images to attach a layer.
    const { data: existingGenImage } = await supabase
        .from('generated_images')
        .select('id')
        .eq('id', dbImageId)
        .single()

    if (!existingGenImage) {
        // Create parent record
        const { error: genImageError } = await supabase
            .from('generated_images')
            .insert({
                id: dbImageId,
                created_by: user.id,
                brand_id: dbBrandId,
                image_url: imageUrl,
                user_prompt: isNewUpload ? 'Uploaded Image' : 'Reference Asset',
                status: isNewUpload ? 'Generated' : 'Shadow'
            })

        if (genImageError) {
            console.error('Failed to create parent generated_image:', genImageError)
            return { error: `Failed to register uploaded image: ${genImageError.message}` }
        }
    }

    // 5. Create Layer Entry in DB
    // We update the type definition on insert to allow nullable brand_id if not already updated in types
    const { data: layer, error: dbError } = await supabase
        .from('image_layers')
        .insert({
            generated_image_id: dbImageId, // Use the proper UUID
            user_id: user.id,
            brand_id: dbBrandId, // Use the nullable brand ID
            layer_type: type,
            layer_url: imageUrl,
            status: 'generating',
            metadata: {
                original_image_url: imageUrl,
                source: 'canvas_segmentation',
                prompt: text,
                rectangle: rectangle,
                type: type,
                original_node_id: imageId // Keep track of the canvas node ID
            }
        })
        .select()
        .single()

    if (dbError) {
        console.error('Layer Creation Error:', dbError)
        await logWorkflow(adminSupabase, {
            workflowName: 'canvas_processing',
            statusCode: 500,
            category: 'DB_ERROR',
            message: 'Layer Creation Error',
            details: dbError,
            userId: user.id,
            brandId: dbBrandId || undefined
        })
        return { error: `DB Error: ${dbError.message}. Details: ${dbError.details || ''}` }
    }

    // 6. Call N8N Webhook
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATION
    if (!webhookUrl) {
        await logWorkflow(adminSupabase, {
            workflowName: 'canvas_processing',
            statusCode: 500,
            category: 'CONFIG_ERROR',
            message: 'Webhook URL not configured',
            userId: user.id,
            brandId: dbBrandId || undefined,
            executionStatus: 'ERROR'
        })
        return { error: 'Webhook URL not configured' }
    }

    const logEntry = await logWorkflow(adminSupabase, {
        workflowName: 'canvas_processing',
        statusCode: 202,
        category: 'SUCCESS',
        message: 'Canvas workflow initiated',
        userId: user.id,
        brandId: dbBrandId || undefined,
        metadata: { image_id: dbImageId, layer_id: layer.id },
        executionStatus: 'PENDING'
    })

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.id,
                brand_id: dbBrandId, // Send null if empty
                image_id: dbImageId, // Send the valid UUID
                layer_id: layer.id,
                log_id: logEntry?.id,
                text_layer: text,
                image_url: imageUrl,
                metadata: {
                    type: type,
                    original_url: imageUrl,
                    rectangle: rectangle,
                    log_id: logEntry?.id,
                    node_id: imageId // Pass original node ID just in case
                }
            })
        })

        if (!response.ok) {
            throw new Error(`Webhook failed: ${response.statusText}`)
        }

        revalidatePath('/dashboard/canvas')
        return { success: true, layerId: layer.id, logId: logEntry?.id }
    } catch (err) {
        console.error('Canvas Webhook Error:', err)
        await logWorkflow(adminSupabase, {
            workflowName: 'canvas_processing',
            statusCode: 502,
            category: 'API_ERROR',
            message: 'Failed to trigger processing engine',
            details: err,
            userId: user.id,
            brandId: activeBrandId,
            metadata: { image_id: imageId, layer_id: layer.id },
            executionStatus: 'ERROR'
        })
        return { error: 'Failed to trigger processing engine.' }
    }

    // Success Log - Removed to favour Pending state

}

export async function saveCanvasState(state: any) {
    // 1. Standard Client to Verify User
    const standardSupabase = await createClient()
    const { data: { user } } = await standardSupabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // 2. Resolve Brand ID
    const { data: profile } = await standardSupabase.from('profiles').select('brand_id').eq('id', user.id).single()
    const brandId = profile?.brand_id

    // 3. Use Service Role Client to Insert (Bypass RLS)
    const supabase = await createServiceRoleClient()

    const { data, error } = await supabase
        .from('canvas_states')
        .insert({
            brand_id: brandId,
            nodes: state.nodes,
            edges: state.edges,
            viewport: state.viewport,
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        console.error('Error saving canvas state:', error)
        return { error: error.message }
    }

    return { success: true, data }
}

export async function getCanvasStates() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Currently fetching all states for the user's brand or just by time
    // Assuming RLS allows us to see our own/brand's rows
    const { data, error } = await supabase
        .from('canvas_states')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20)

    if (error) {
        console.error('Error fetching canvas states:', error)
        return { error: error.message }
    }

    return { success: true, data }
}

export async function deleteCanvasState(id: string) {
    // 1. Verify User
    const standardSupabase = await createClient()
    const { data: { user } } = await standardSupabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // 2. Use Service Role to Delete
    const supabase = await createServiceRoleClient()

    const { error } = await supabase
        .from('canvas_states')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function getLayerStatus(layerId: string) {
    // Check status using service role to bypass potential RLS issues for the user
    // This is a "fix" for users who haven't run migration scripts
    const supabase = await createServiceRoleClient()

    const { data, error } = await supabase
        .from('image_layers')
        .select('status, layer_url, metadata')
        .eq('id', layerId)
        .single()

    if (error) {
        return { error: error.message }
    }

    return { success: true, data }
}
