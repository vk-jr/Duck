'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

export async function createQualityCheck(formData: FormData) {
    const supabase = await createClient()

    const brandId = formData.get('brandId') as string
    const file = formData.get('image') as File

    if (!file) {
        return { success: false, error: 'No file uploaded' }
    }

    try {
        const user = await supabase.auth.getUser()
        const userId = user.data.user?.id

        if (!userId) {
            return { success: false, error: 'User not authenticated' }
        }

        // 1. Upload Image to Storage
        // Assuming a 'quality-checks' bucket exists, or using a general one
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('images') // Using existing 'images' bucket or create 'quality-checks'
            .upload(fileName, file)

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return { success: false, error: 'Failed to upload image' }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('images')
            .getPublicUrl(fileName)

        // 2. Mock Analysis Result
        // In a real scenario, this would call an AI service
        const mockResult = {
            compliant: true,
            score: 0.95,
            issues: [],
            timestamp: new Date().toISOString()
        }

        // 3. Save to Database
        const { data: insertData, error: insertError } = await supabase
            .from('quality_checks')
            .insert({
                user_id: userId,
                brand_id: brandId || null,
                image_url: publicUrl,
                status: 'completed',
                result: mockResult
            })
            .select()
            .single()

        if (insertError) {
            console.error('Database insert error:', insertError)
            return { success: false, error: 'Failed to save check result' }
        }

        revalidatePath('/dashboard/quality-checker/check')
        return { success: true, data: insertData }

    } catch (e) {
        console.error('Unexpected error:', e)
        return { success: false, error: 'An unexpected error occurred' }
    }
}

export async function generateBrandGuidelines(formData: FormData) {
    const supabase = await createClient()

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

        // 3. Create Record in 'generated_images' (to track status)
        const { data: insertedImage, error: dbError } = await supabase
            .from('generated_images')
            .insert({
                brand_id: brandId,
                user_prompt: instructions || 'Generate Brand Guidelines',
                status: 'generating',
                created_by: user.id
            })
            .select()
            .single()

        if (dbError) {
            console.error('DB Insert Error:', dbError)
            return { success: false, error: 'Failed to create generation record' }
        }

        // 4. Call Webhook
        const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_GENERATION
        if (!webhookUrl) return { success: false, error: 'Webhook URL not configured' }

        const webhookBody = {
            prompt: instructions,
            image_id: insertedImage.id,
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

        revalidatePath('/dashboard/quality-checker/create')
        return { success: true, data: insertedImage }

    } catch (e) {
        console.error('Action error:', e)
        return { success: false, error: 'Failed to start generation' }
    }
}
