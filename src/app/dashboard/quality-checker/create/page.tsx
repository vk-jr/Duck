'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Wand2, Loader2, AlertCircle, CheckCircle, Image as ImageIcon, X } from 'lucide-react'
import { getBrands, generateBrandGuidelines } from '@/app/actions/quality-checker'
import { cn } from '@/lib/utils'

interface Brand {
    id: string
    name: string
}

export default function CreateBrandGuidelinesPage() {
    const [brands, setBrands] = useState<Brand[]>([])
    const [selectedBrand, setSelectedBrand] = useState<string>('')
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [instructions, setInstructions] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        async function loadBrands() {
            const data = await getBrands()
            setBrands(data)
        }
        loadBrands()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setPreviewUrl(URL.createObjectURL(selectedFile))
            setStatus('idle')
        }
    }

    const removeFile = () => {
        setFile(null)
        setPreviewUrl(null)
    }

    const handleSubmit = async () => {
        if (!file || !selectedBrand) return

        setIsSubmitting(true)
        setStatus('idle')
        setErrorMessage('')

        const formData = new FormData()
        formData.append('image', file)
        formData.append('brandId', selectedBrand)
        formData.append('instructions', instructions)

        try {
            const result = await generateBrandGuidelines(formData)
            if (result.success) {
                setStatus('success')
                setFile(null)
                setPreviewUrl(null)
                setInstructions('')
            } else {
                setStatus('error')
                setErrorMessage(result.error || 'Failed to start generation')
            }
        } catch (e) {
            setStatus('error')
            setErrorMessage('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-serif font-bold tracking-tight">Create Brand Guidelines</h1>
                <p className="text-muted-foreground">Define your brand's visual identity with AI.</p>
            </div>

            <div className="flex flex-1 gap-6 min-h-0">
                {/* Main Preview Area - Takes majority of space */}
                <div className="flex-[2] relative bg-muted/20 border-2 border-dashed border-border rounded-3xl overflow-hidden group hover:border-primary/50 transition-colors">
                    {previewUrl ? (
                        <div className="relative w-full h-full flex items-center justify-center bg-black/5 dark:bg-black/20 p-8">
                            <motion.img
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={previewUrl}
                                alt="Preview"
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                            />
                            <button
                                onClick={removeFile}
                                className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-md border border-border rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto"
                                onChange={handleFileChange}
                            />
                            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-medium text-foreground mb-2">Drop Reference Image</h3>
                            <p className="max-w-sm text-center">Upload a logo, moodboard, or style reference to get started.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Controls - Fixed width */}
                <div className="w-[400px] flex flex-col gap-6 bg-card border border-border rounded-3xl p-6 shadow-sm overflow-y-auto">
                    {/* Brand Selector */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                            Target Brand <span className="text-red-500">*</span>
                        </label>
                        <select
                            className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                        >
                            <option value="">Select a Brand...</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-3 flex-1 flex flex-col">
                        <label className="text-sm font-medium flex items-center gap-2">
                            Custom Instructions
                        </label>
                        <div className="relative flex-1">
                            <textarea
                                className="w-full h-full min-h-[200px] p-4 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all font-mono text-sm leading-relaxed"
                                placeholder="e.g. Use a minimalist style with high contrast. The primary color should be #FF5733. Avoid gradients."
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                            />
                            <FileText className="absolute bottom-4 right-4 w-4 h-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {/* Status Messages */}
                    <AnimatePresence mode="wait">
                        {status === 'error' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-3"
                            >
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {errorMessage}
                            </motion.div>
                        )}
                        {status === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-4 rounded-xl bg-green-500/10 text-green-500 text-sm flex items-center gap-3"
                            >
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                Generation started! Check gallery.
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Action Button */}
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedBrand || !file || isSubmitting}
                        className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                Generate Guidelines
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
