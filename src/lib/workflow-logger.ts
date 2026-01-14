import { SupabaseClient } from '@supabase/supabase-js'

export type WorkflowStatusCategory = 'SUCCESS' | 'API_ERROR' | 'DB_ERROR' | 'CLIENT_ERROR' | 'CONFIG_ERROR'

interface LogWorkflowParams {
    workflowName: string
    statusCode: number
    category: WorkflowStatusCategory
    message?: string
    details?: any
    userId?: string
    brandId?: string
    metadata?: any
}

/**
 * Shared utility to log workflow executions to the workflow_logs table.
 * @param supabase - The Supabase client (preferably service role for error logging to ensure write access)
 * @param params - The log parameters
 */
export async function logWorkflow(
    supabase: SupabaseClient,
    params: LogWorkflowParams & { executionStatus?: string }
) {
    try {
        const { data, error } = await supabase.from('workflow_logs').insert({
            workflow_name: params.workflowName,
            status_code: params.statusCode,
            status_category: params.category,
            message: params.message,
            details: params.details,
            user_id: params.userId,
            brand_id: params.brandId,
            metadata: params.metadata,
            execution_status: params.executionStatus || 'PENDING'
        }).select().single()

        if (error) {
            console.error('Failed to write to workflow_logs:', error)
            return null
        }

        return data
    } catch (e) {
        console.error('Exception in logWorkflow:', e)
        return null
    }
}
