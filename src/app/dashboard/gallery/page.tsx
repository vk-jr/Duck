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
    const { data: genImages } = await supabase
        .from('generated_images')
        .select('*')
        .eq('created_by', user.id)
        .eq('status', 'Generated')
        .order('created_at', { ascending: false })

    // 2.5 Fetch Quality Check Uploads
    const { data: checkImages } = await supabase
        .from('quality_checks')
        .select('id, image_url, brand_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Deduplicate checks by image_url
    const uniqueCheckImages = checkImages?.filter((check, index, self) =>
        index === self.findIndex((t) => t.image_url === check.image_url)
    ) || []

    // Normalize Quality Checks
    const formattedCheckImages = uniqueCheckImages.map(check => ({
        id: check.id,
        image_url: check.image_url,
        brand_id: check.brand_id,
        user_prompt: 'Quality Check Upload',
        status: 'Generated',
        created_at: check.created_at,
        created_by: user.id
    }))

    // 2.7 Fetch Brand Guidelines Images
    const { data: brandRefImages } = await supabase
        .from('brands')
        .select('id, name, reference_image_url, created_at')
        .not('reference_image_url', 'is', null)

    // Normalize Brand Guidelines
    const formattedBrandImages = (brandRefImages || []).map(brand => ({
        id: brand.id,
        image_url: brand.reference_image_url,
        brand_id: brand.id,
        user_prompt: `Brand Guidelines (${brand.name})`,
        status: 'Generated',
        created_at: brand.created_at || new Date().toISOString(),
        created_by: user.id
    }))

    // Combine
    const allImages = [...(genImages || []), ...formattedCheckImages, ...formattedBrandImages]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // 3. Fetch Image Layers
    const { data: layers } = await supabase
        .from('image_layers')
        .select('*')
        .eq('user_id', user.id)
        .or('status.eq.generated,status.eq.Generated')
        .order('created_at', { ascending: false })

    return (
        <GalleryClient
            images={allImages || []}
            layers={layers || []}
            brands={brands || []}
        />
    )
}
