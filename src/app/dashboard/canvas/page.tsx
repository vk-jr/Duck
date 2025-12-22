import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CanvasClient from './client'

export const dynamic = 'force-dynamic'

export default async function CanvasPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // Fetch Generated Images for Sidebar
    const { data: images } = await supabase
        .from('generated_images')
        .select('*')
        .eq('created_by', user.id)
        .eq('status', 'Generated')
        .order('created_at', { ascending: false })

    return <CanvasClient images={images || []} />
}
