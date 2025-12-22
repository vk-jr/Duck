import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GalleryClient from './client'

export const dynamic = 'force-dynamic'

export default async function GalleryPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // 1. Fetch User's Brands
    const { data: brands } = await supabase
        .from('brands')
        .select('id, name')
        .order('name', { ascending: true })

    // 2. Fetch Generated Images
    const { data: images } = await supabase
        .from('generated_images')
        .select('*')
        .eq('created_by', user.id)
        .eq('status', 'Generated')
        .order('created_at', { ascending: false })

    return (
        <GalleryClient
            images={images || []}
            brands={brands || []}
        />
    )
}
