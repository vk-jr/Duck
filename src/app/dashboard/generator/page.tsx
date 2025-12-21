
import { createClient } from '@/lib/supabase/server'
import GeneratorClient from './client'
import { redirect } from 'next/navigation'

export default async function GeneratorPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch brands the user has access to
    // (Using strict RLS, simply selecting from 'brands' should return only permitted rows)
    const { data: brands } = await supabase
        .from('brands')
        .select('id, name')
        .order('created_at', { ascending: false })

    return <GeneratorClient brands={brands || []} />
}
