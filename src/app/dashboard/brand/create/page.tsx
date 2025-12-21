'use client'

import { useFormStatus } from 'react-dom'
import { Bird, UploadCloud, Loader2, AlertCircle } from 'lucide-react'
import { createBrand } from './actions'
import { useActionState } from 'react'

const initialState = {
    message: '',
    error: '',
}

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-primary text-black font-bold py-3 rounded-xl hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {pending ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Brand...
                </>
            ) : (
                'Create Brand'
            )}
        </button>
    )
}

export default function CreateBrandPage() {
    const [state, formAction] = useActionState(createBrand, initialState)

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="space-y-2 text-center">
                <h2 className="text-3xl font-bold text-white tracking-tight">New Brand Style</h2>
                <p className="text-muted-foreground">Define a new visual identity for your assets.</p>
            </div>

            <div className="glass-card p-8 rounded-2xl">
                <form action={formAction} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Brand Name</label>
                        <input
                            name="name"
                            type="text"
                            placeholder="e.g., Acme Corp, Retro Future"
                            required
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Reference Images</label>
                        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium text-white">Click to upload brand assets</p>
                                <p className="text-xs text-muted-foreground">Upload 10-20 images for best results</p>
                            </div>
                        </div>
                        <p className="text-xs text-yellow-500/80 mt-2">
                            * Note: Reference image analysis will be connected to n8n in the next step.
                        </p>
                    </div>

                    {state?.error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {state.error}
                        </div>
                    )}

                    <SubmitButton />
                </form>
            </div>
        </div>
    )
}
