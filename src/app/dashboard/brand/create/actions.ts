'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createBrand(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    if (!name) return { error: 'Brand name is required' }

    // 1. Create Brand
    // Note: RLS Policy "Users can create brands" must allow this.
    const { data: brand, error: brandError } = await supabase
        .from('brands')
        .insert({
            name,
            created_by: user.id
        })
        .select()
        .single()

    if (brandError) {
        console.error('Brand Create Error:', brandError)
        // Return the actual error message for debugging if needed, but safe message for user
        return { error: `Brand creation failed: ${brandError.message}` }
    }

    // 2. Redirect
    // We use `redirect` here which throws an error, so it must be outside the try/catch blocks if we had them.
    // `useActionState` handles this correctly.

    revalidatePath('/dashboard')
    redirect(`/dashboard/generator?brandId=${brand.id}`)
}
