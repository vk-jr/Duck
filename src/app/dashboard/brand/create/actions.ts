'use server'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logWorkflow } from '@/lib/workflow-logger'

export async function createBrand(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const name = formData.get('name') as string
    if (!name) return { error: 'Brand name is required' }

    // 1. Create Brand
    // Use service role for logging
    const adminSupabase = await createServiceRoleClient()

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
        await logWorkflow(adminSupabase, {
            workflowName: 'create_brand',
            statusCode: 500,
            category: 'DB_ERROR',
            message: 'Brand creation failed',
            details: brandError,
            userId: user.id
        })
        // Return the actual error message for debugging if needed, but safe message for user
        return { error: `Brand creation failed: ${brandError.message}` }
    }

    await logWorkflow(adminSupabase, {
        workflowName: 'create_brand',
        statusCode: 200,
        category: 'SUCCESS',
        message: 'Brand created successfully',
        userId: user.id,
        brandId: brand.id
    })

    // 2. Redirect
    // We use `redirect` here which throws an error, so it must be outside the try/catch blocks if we had them.
    // `useActionState` handles this correctly.

    revalidatePath('/dashboard')
    redirect(`/dashboard/generator?brandId=${brand.id}`)
}
