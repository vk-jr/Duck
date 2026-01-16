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
            // 1. Delete associated layers first (to satisfy FK constraints if not cascading)
            // Use adminSupabase to bypass RLS, but we MUST filter by user ownership logic to be safe.
            // But wait, generated_images uses 'created_by'. Layers use 'user_id'.
            // For safety, let's just delete layers linked to this image.
            // Since we verify the IMAGE belongs to the user, deeper deletion is implied intent.

            // Verify ownership first before any deletion
            const { data: image } = await adminSupabase
                .from('generated_images')
                .select('id')
                .eq('id', id)
                .eq('created_by', user.id)
                .single()

            if (!image) return { error: 'Image not found or unauthorized' }

            // Delete Child Layers
            const { error: layersError } = await adminSupabase
                .from('image_layers')
                .delete()
                .eq('generated_image_id', id)

            if (layersError) console.error('Error deleting cleanup layers:', layersError)

            // Delete Parent Image
            const { error: deleteError } = await adminSupabase
                .from('generated_images')
                .delete()
                .eq('id', id)

            error = deleteError
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
