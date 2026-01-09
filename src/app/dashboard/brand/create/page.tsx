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
        <div className="h-[85vh] w-full flex items-center justify-center p-6 md:p-12">
            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Side: Text Content */}
                <div className="space-y-6 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-5xl md:text-6xl font-extrabold text-foreground tracking-tight leading-none mb-4">
                            New Brand<br />Style
                        </h2>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Define a new unique visual identity for your AI assets. Upload your reference images and let our AI handle the rest.
                        </p>
                    </motion.div>

                    {/* Decorative Elements or Steps could go here */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="flex gap-4 pt-4"
                    >
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-foreground">1. Name</span>
                            <span className="text-xs text-muted-foreground">Main Identifier</span>
                        </div>
                        <div className="w-px h-10 bg-border" />
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-foreground">2. Upload</span>
                            <span className="text-xs text-muted-foreground">Assets</span>
                        </div>
                        <div className="w-px h-10 bg-border" />
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-foreground">3. Create</span>
                            <span className="text-xs text-muted-foreground">Analysis</span>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side: Form Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-card border border-border/50 p-8 md:p-10 rounded-[2rem] shadow-2xl shadow-black/5"
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
                            <div className="relative border-2 border-dashed border-border rounded-xl p-8 md:p-12 flex flex-col items-center justify-center gap-4 hover:bg-secondary/30 hover:border-primary/50 transition-all cursor-pointer group bg-secondary/10">
                                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center shadow-sm border border-border group-hover:scale-110 group-hover:shadow-md transition-all">
                                    <UploadCloud className="w-8 h-8 text-primary/80" />
                                </div>
                                <div className="text-center space-y-1">
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
