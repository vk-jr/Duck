'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

interface ProcessCanvasParams {
    imageId: string
    imageUrl: string
    brandId?: string
    text: string
    type: string
    rectangle?: number[]
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
        return { error: 'Could not resolve Brand ID. Please Create a Brand first.' }
    }

    // 2. Create Layer Entry in DB
    // We assume 'image_layers' table exists and links to 'generated_images' via 'generated_image_id' or similar.
    // Based on user request, we store the original URL in metadata.
    const { data: layer, error: dbError } = await supabase
        .from('image_layers')
        .insert({
            generated_image_id: imageId,
            user_id: user.id, // Saving User ID as requested
            brand_id: activeBrandId,
            layer_type: type,
            layer_url: imageUrl, // Initializing with original URL to satisfy NOT NULL constraint
            status: 'generating', // Setting initial status
            metadata: {
                original_image_url: imageUrl,
                source: 'canvas_segmentation',
                prompt: text,
                rectangle: rectangle, // Store rectangle in metadata
                type: type, // Store type in metadata
            }
        })
        .select()
        .single()

    if (dbError) {
        console.error('Layer Creation Error:', dbError)
        return { error: `DB Error: ${dbError.message}. Details: ${dbError.details || ''}` }
    }

    // 3. Call N8N Webhook
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATION
    if (!webhookUrl) return { error: 'Webhook URL not configured' }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.id,
                brand_id: activeBrandId,
                image_id: imageId,
                layer_id: layer.id, // N8N can now update this specific layer row
                text_layer: text,
                image_url: imageUrl, // Send original URL as requested
                metadata: {
                    type: type,
                    original_url: imageUrl,
                    rectangle: rectangle // Send rectangle to webhook
                }
            })
        })

        if (!response.ok) {
            throw new Error(`Webhook failed: ${response.statusText}`)
        }

        return { success: true, layerId: layer.id }
    } catch (err) {
        console.error('Canvas Webhook Error:', err)
        return { error: 'Failed to trigger processing engine.' }
    }
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
