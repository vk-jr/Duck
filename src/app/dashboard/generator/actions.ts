'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function generateImage(formData: FormData) {
    const supabase = await createClient()

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'Unauthorized' }
    }

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
        return { error: 'Failed to start generation record.' }
    }

    // 4. Call n8n Webhook
    // We pass the prompt AND the `generated_image_id` so n8n can update THIS specific row.
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATION
    if (!webhookUrl) return { error: 'Webhook URL not configured' }

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
                metadata: {
                    type: generationType
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
        return { error: 'Failed to trigger AI agent.' }
    }

    revalidatePath('/dashboard/generator')
    return { success: true, imageId: insertedImage.id }
}
