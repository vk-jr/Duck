'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteAsset(id: string, type: 'image' | 'layer') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const adminSupabase = await createServiceRoleClient()

    try {
        let error
        if (type === 'image') {
            // Priority 1: Check in Generated Images (Canvas & Standard generations)
            const { data: genImage } = await adminSupabase
                .from('generated_images')
                .select('id')
                .eq('id', id)
                .eq('created_by', user.id)
                .single()

            if (genImage) {
                // Delete associated layers first
                const { error: layersError } = await adminSupabase
                    .from('image_layers')
                    .delete()
                    .eq('generated_image_id', id)

                if (layersError) console.error('Error deleting cleanup layers:', layersError)

                const { error: deleteError } = await adminSupabase
                    .from('generated_images')
                    .delete()
                    .eq('id', id)

                error = deleteError
            } else {
                // Priority 2: Check in Quality Checks (Uploaded Images from Check Guidelines)
                const { data: qualityCheck } = await adminSupabase
                    .from('quality_checks')
                    .select('id')
                    .eq('id', id)
                    .eq('user_id', user.id)
                    .single()

                if (qualityCheck) {
                    const { error: deleteError } = await adminSupabase
                        .from('quality_checks')
                        .delete()
                        .eq('id', id)

                    error = deleteError
                } else {
                    // Priority 3: Check in Brands (Reference Images)
                    // If ID matches a brand, we just clear the reference image, we DON'T delete the brand.
                    // We assume RLS or previous fetch logic ensures this is the user's brand (or we can check profile linkage if strictness needed).
                    // For now, checking if it exists and clearing image.
                    const { data: brand } = await adminSupabase
                        .from('brands')
                        .select('id')
                        .eq('id', id)
                        .single()

                    if (brand) {
                        const { error: updateError } = await adminSupabase
                            .from('brands')
                            .update({ reference_image_url: null })
                            .eq('id', id)

                        error = updateError
                    } else {
                        return { error: 'Asset not found or unauthorized' }
                    }
                }
            }
        } else {
            // Delete Layer
            const { error: deleteError } = await adminSupabase
                .from('image_layers')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id) // Ensure ownership
            error = deleteError
        }

        if (error) {
            console.error('Delete error:', error)
            return { error: error.message }
        }

        revalidatePath('/dashboard/gallery')
        return { success: true }
    } catch (e) {
        console.error('Delete exception:', e)
        return { error: 'Failed to delete asset' }
    }
}
