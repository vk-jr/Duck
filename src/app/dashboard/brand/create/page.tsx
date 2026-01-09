'use client'

import { useFormStatus } from 'react-dom'
import { UploadCloud, Loader2, AlertCircle } from 'lucide-react'
import { createBrand } from './actions'
import { useActionState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

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
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
            {pending ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Identity...
                </>
            ) : (
                'Create Brand Identity'
            )}
        </button>
    )
}

export default function CreateBrandPage() {
    const [state, formAction] = useActionState(createBrand, initialState)

    return (
        <div className="h-[85vh] w-full flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-xl space-y-8">
                <div className="space-y-2 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl font-extrabold text-foreground tracking-tight"
                    >
                        New Brand Style
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-lg text-muted-foreground"
                    >
                        Define a new unique visual identity for your assets.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-card border border-border/50 p-8 rounded-3xl shadow-2xl shadow-black/5"
                >
                    <form action={formAction} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground ml-1">Brand Name</label>
                            <input
                                name="name"
                                type="text"
                                placeholder="e.g., Acme Corp, Retro Future"
                                required
                                className="w-full bg-secondary/50 border border-border text-foreground px-5 py-3.5 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground ml-1">Reference Images</label>
                            <div className="relative border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 hover:bg-secondary/30 hover:border-primary/50 transition-all cursor-pointer group bg-secondary/10">
                                <div className="w-14 h-14 bg-background rounded-full flex items-center justify-center shadow-sm border border-border group-hover:scale-110 group-hover:shadow-md transition-all">
                                    <UploadCloud className="w-7 h-7 text-primary/80" />
                                </div>
                                <div className="text-center space-y-0.5">
                                    <p className="font-semibold text-foreground text-sm">Click to upload brand assets</p>
                                    <p className="text-xs text-muted-foreground">Upload 10-20 images for best results</p>
                                </div>
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                    multiple
                                />
                            </div>
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground text-center pt-2 opacity-60">
                                Zero-shot analysis • Automatic Style Extraction
                            </p>
                        </div>

                        {state?.error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive text-sm font-medium"
                            >
                                <AlertCircle className="w-5 h-5" />
                                {state.error}
                            </motion.div>
                        )}

                        <div className="pt-2">
                            <SubmitButton />
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    )
}
