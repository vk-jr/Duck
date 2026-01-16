'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Image as ImageIcon, Loader2, ChevronDown, Plus, Wand2, Download, Edit, RefreshCw, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateImage, getWorkflowLog } from './actions'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Brand {
    id: string
    name: string
}

export default function GeneratorClient({ brands = [] }: { brands: Brand[] }) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [prompt, setPrompt] = useState('')
    const [selectedBrandId, setSelectedBrandId] = useState<string>(brands[0]?.id || '')
    const [currentImageId, setCurrentImageId] = useState<string | null>(null)
    const [currentLogId, setCurrentLogId] = useState<string | null>(null)
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
    const [isFocused, setIsFocused] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    // Polling / Realtime Effect
    useEffect(() => {
        if (!currentImageId && !currentLogId) return

        const checkStatus = async () => {
            // 1. Check Log Status (Primary Gatekeeper)
            if (currentLogId) {
                const log = await getWorkflowLog(currentLogId)
                if (log) {
                    const status = log.execution_status

                    // Success: Status is 200
                    if (String(status) === '200') {
                        // Log says 200. Now Check Image Entity.
                        if (currentImageId) {
                            const { data } = await supabase
                                .from('generated_images')
                                .select('image_url')
                                .eq('id', currentImageId)
                                .single()

                            if (data && data.image_url) {
                                setGeneratedImageUrl(data.image_url)
                                setIsGenerating(false)
                                setCurrentImageId(null)
                                setCurrentLogId(null)
                                router.refresh()
                                return true // Done
                            }
                        }
                        return false // Log is 200, but Image not ready yet. Keep polling.
                    }
                    // Pending
                    else if (status === 'PENDING') {
                        // continue polling
                        return false
                    }
                    // Error (Any other status)
                    else {
                        let errorMsg = 'Workflow failed'
                        if (log.details && typeof log.details === 'string') {
                            errorMsg = log.details
                        } else if (log.details && typeof log.details === 'object' && log.details.message) {
                            errorMsg = log.details.message
                        } else if (log.message) {
                            errorMsg = log.message
                        }

                        setIsGenerating(false)
                        setCurrentImageId(null)
                        setCurrentLogId(null)
                        alert(`${errorMsg} (Error: ${status})`)
                        return true
                    }
                }
            }

            // Fallback: If no log ID or log not found, keep waiting (or handle error? assume waiting)
            return false
        }

        // 1. Check Immediately
        checkStatus()

        // 2. Realtime Subscription (Only if we have an image ID to watch)
        let channel: any = null
        if (currentImageId) {
            channel = supabase
                .channel('schema-db-changes')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'generated_images',
                        filter: `id=eq.${currentImageId}`
                    },
                    (payload) => {
                        checkStatus()
                    }
                )
                .subscribe()
        }

        // 3. Polling Fallback
        const interval = setInterval(async () => {
            const isDone = await checkStatus()
            if (isDone) clearInterval(interval)
        }, 2000)

        return () => {
            if (channel) supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [currentImageId, currentLogId, supabase, router])

    const handleGenerate = async () => {
        if (!prompt) return
        if (!selectedBrandId) {
            alert('Please select or create a brand first.')
            return
        }

        setIsGenerating(true)
        setGeneratedImageUrl(null)

        const formData = new FormData()
        formData.append('prompt', prompt)
        formData.append('brand_id', selectedBrandId)

        // Get generation type
        const typeSelect = document.getElementById('generationType') as HTMLSelectElement
        let generationType = typeSelect ? typeSelect.value : 'generation'

        // Override for Content Beta
        const selectedBrand = brands.find(b => b.id === selectedBrandId)
        if (selectedBrand?.name?.toLowerCase().includes('content beta')) {
            generationType = 'content beta'
        }

        formData.append('generation_type', generationType)

        const result = await generateImage(formData)

        if (result.error) {
            alert(result.error)
            setIsGenerating(false)
            return
        }

        if (result.success && result.imageId) {
            setCurrentImageId(result.imageId)
            if (result.logId) setCurrentLogId(result.logId)
        }
    }

    return (
        <div className="h-[85vh] w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-1">
            {/* Left Column: Controls (4 cols) */}
            <div className="lg:col-span-4 flex flex-col h-full relative">
                <div className="flex-1 flex flex-col justify-center space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-4"
                    >
                        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
                            Create<span className="text-primary">.</span>
                        </h1>
                        <p className="text-muted-foreground text-lg font-light leading-relaxed">
                            Craft stunning visual assets tailored to your brand identity with a single prompt.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className={cn(
                            "relative group rounded-3xl transition-all duration-300",
                            isFocused ? "ring-2 ring-primary/20 bg-background shadow-2xl" : "bg-secondary/30 hover:bg-secondary/50"
                        )}
                    >
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            disabled={isGenerating}
                            placeholder="Describe your vision..."
                            className="w-full bg-transparent border-none text-foreground text-lg placeholder:text-muted-foreground/40 p-6 min-h-[220px] resize-none focus:ring-0 rounded-3xl leading-relaxed"
                        />

                        {/* Hidden gen type */}
                        <div className="hidden">
                            <select id="generationType" defaultValue="generation">
                                <option value="generation">Generation</option>
                            </select>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="space-y-4"
                    >
                        <div className="flex gap-3">
                            <div className="relative flex-1 group">
                                <select
                                    value={selectedBrandId}
                                    onChange={(e) => setSelectedBrandId(e.target.value)}
                                    className="appearance-none w-full bg-background border border-border text-foreground text-sm font-medium pl-4 pr-10 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/10 hover:border-primary/30 transition-all cursor-pointer shadow-sm"
                                >
                                    {brands.length === 0 && <option value="">No Brands Found</option>}
                                    {brands.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
                            </div>


                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!prompt || isGenerating || !selectedBrandId}
                            className={cn(
                                "w-full py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98]",
                                prompt && !isGenerating
                                    ? "bg-primary text-primary-foreground shadow-primary/20 hover:bg-primary/90"
                                    : "bg-muted text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Creating Magic...</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    <span>Generate Asset</span>
                                </>
                            )}
                        </button>
                    </motion.div>
                </div>
            </div>

            {/* Right Column: Canvas (8 cols) */}
            <div className="lg:col-span-8 relative">
                <div className="absolute inset-0 bg-secondary/20 rounded-[2.5rem] border border-border/40 backdrop-blur-sm -z-10" />

                <div className="h-full w-full rounded-[2.5rem] overflow-hidden relative flex items-center justify-center p-8">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

                    <AnimatePresence mode="wait">
                        {!generatedImageUrl && !isGenerating && (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4 }}
                                className="text-center space-y-6 max-w-md"
                            >
                                <div className="w-24 h-24 bg-background rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-black/5 rotate-3 border border-border/50">
                                    <Sparkles className="w-10 h-10 text-primary/80" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold text-foreground tracking-tight">Ready to Dream</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Select a brand, enter a prompt, and watch your vision come to life in seconds.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {isGenerating && !generatedImageUrl && (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-8"
                            >
                                <div className="relative w-32 h-32">
                                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-lg font-medium text-foreground">Generating Asset...</p>
                                    <p className="text-sm text-muted-foreground animate-pulse">Consulting brand guidelines</p>
                                </div>
                            </motion.div>
                        )}

                        {generatedImageUrl && (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative w-full h-full flex items-center justify-center group"
                            >
                                <img
                                    src={generatedImageUrl}
                                    alt="Generated Result"
                                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]"
                                />

                                <div className="absolute bottom-8 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 bg-black/80 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-2xl">
                                    <button className="px-5 py-2.5 rounded-xl text-white hover:bg-white/10 transition-colors flex items-center gap-2 text-sm font-medium">
                                        <Download className="w-4 h-4" /> Download
                                    </button>
                                    <div className="w-px h-6 bg-white/20" />
                                    <button
                                        onClick={() => window.open(generatedImageUrl, '_blank')}
                                        className="px-5 py-2.5 rounded-xl text-white hover:bg-white/10 transition-colors flex items-center gap-2 text-sm font-medium"
                                    >
                                        <ExternalLink className="w-4 h-4" /> Open
                                    </button>
                                    <div className="w-px h-6 bg-white/20" />
                                    <button
                                        onClick={() => router.push('/dashboard/canvas')}
                                        className="px-5 py-2.5 bg-white text-black rounded-xl hover:bg-white/90 transition-colors flex items-center gap-2 text-sm font-bold shadow-lg"
                                    >
                                        <Edit className="w-4 h-4" /> Edit in Canvas
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
