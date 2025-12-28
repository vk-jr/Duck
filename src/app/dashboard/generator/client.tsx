'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Image as ImageIcon, Loader2, ChevronDown, Plus, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { generateImage } from './actions'
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
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    // Polling / Realtime Effect
    useEffect(() => {
        if (!currentImageId) return

        const checkStatus = async () => {
            const { data } = await supabase
                .from('generated_images')
                .select('status, image_url')
                .eq('id', currentImageId)
                .single()

            if (data?.image_url && data?.status?.toLowerCase() === 'generated') {
                setGeneratedImageUrl(data.image_url)
                setIsGenerating(false)
                setCurrentImageId(null)
                router.refresh()
                return true // Done
            } else if (data?.status === 'failed') {
                setIsGenerating(false)
                setCurrentImageId(null)
                alert('Generation failed.')
                return true // Done
            }
            return false // Keep waiting
        }

        // 1. Check Immediately (in case it finished fast)
        checkStatus()

        // 2. Realtime Subscription
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'generated_images',
                    filter: `id=eq.${currentImageId}`,
                },
                (payload) => {
                    // Realtime update received, check status
                    checkStatus()
                }
            )
            .subscribe()

        // 3. Polling Fallback (every 2s)
        const interval = setInterval(async () => {
            const isDone = await checkStatus()
            if (isDone) clearInterval(interval)
        }, 2000)

        return () => {
            supabase.removeChannel(channel)
            clearInterval(interval)
        }
    }, [currentImageId, supabase, router])


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
        if (typeSelect) {
            formData.append('generation_type', typeSelect.value)
        }

        const result = await generateImage(formData)

        if (result.error) {
            alert(result.error)
            setIsGenerating(false)
            return
        }

        if (result.success && result.imageId) {
            setCurrentImageId(result.imageId)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 tracking-tighter"
                >
                    What shall we create?
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                    className="text-muted-foreground text-lg font-light"
                >
                    Our AI will match your brand's unique style automatically.
                </motion.p>
            </div>

            {/* Prompt Input */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative glass-card rounded-3xl p-3 transition-all shadow-2xl shadow-primary/5 focus-within:shadow-primary/20 focus-within:ring-1 focus-within:ring-primary/20 hover:shadow-primary/10 group"
            >
                {/* Generation Type Selector */}
                <div className="absolute top-4 right-4 z-10">
                    <select
                        name="generationType"
                        id="generationType"
                        className="appearance-none bg-black/40 border border-white/10 text-white text-xs font-medium px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary hover:bg-white/10 cursor-pointer transition-colors"
                        defaultValue="generation"
                    >
                        <option value="generation">Generation</option>
                        <option value="segmentation">Segmentation</option>
                        <option value="quality_check">Quality Check</option>
                    </select>
                </div>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isGenerating}
                    placeholder="Describe your vision... (e.g., 'A cinematic shot of a luxury watch on a marble surface')"
                    className="w-full bg-transparent border-none text-white text-xl font-light placeholder:text-white/20 p-6 focus:ring-0 min-h-[160px] resize-none disabled:opacity-50"
                />

                <div className="flex flex-col md:flex-row justify-between items-center px-4 pb-4 gap-4">
                    <div className="flex gap-4 items-center w-full md:w-auto">
                        <button disabled={isGenerating} className="p-3 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-colors" title="Upload Reference">
                            <ImageIcon className="w-5 h-5" />
                        </button>

                        {/* BRAND SELECTOR */}
                        <div className="relative group/brand flex-1 md:flex-none">
                            <select
                                value={selectedBrandId}
                                onChange={(e) => setSelectedBrandId(e.target.value)}
                                className="appearance-none w-full md:w-auto bg-white/5 border border-white/10 text-white text-sm font-medium pl-4 pr-10 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary hover:bg-white/10 cursor-pointer transition-colors"
                            >
                                {brands.length === 0 && <option value="">No Brands Found</option>}
                                {brands.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none group-hover/brand:text-white transition-colors" />
                        </div>

                        {/* Create New Link */}
                        <Link href="/dashboard/brand/create" className="text-xs font-bold text-black bg-primary px-4 py-2.5 rounded-xl hover:bg-primary/80 transition-all flex items-center gap-2 shadow-sm hover:shadow-md hover:scale-[1.02]">
                            <Plus className="w-4 h-4" /> New Brand
                        </Link>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!prompt || isGenerating || !selectedBrandId}
                        className={cn(
                            "flex items-center gap-3 px-8 py-3.5 rounded-xl font-bold text-lg transition-all w-full md:w-auto justify-center",
                            prompt && !isGenerating
                                ? "bg-white text-black hover:scale-105 shadow-xl shadow-white/10 relative overflow-hidden group/btn"
                                : "bg-white/5 text-muted-foreground cursor-not-allowed"
                        )}
                    >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                        {isGenerating ? 'Dreaming...' : 'Generate Asset'}

                        {/* Shimmer Effect */}
                        {prompt && !isGenerating && (
                            <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        )}
                    </button>
                </div>
            </motion.div>

            {/* Loading / Results View - AnimatePresence wrapper */}
            <AnimatePresence mode="wait">
                {isGenerating && !generatedImageUrl && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full aspect-video rounded-3xl bg-white/5 flex items-center justify-center border border-white/5 relative overflow-hidden"
                    >
                        {/* Skeleton Shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_2s_infinite]" />

                        <div className="flex flex-col items-center gap-6 z-10">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                                </div>
                            </div>
                            <p className="text-muted-foreground animate-pulse text-sm uppercase tracking-widest">Consulting Brand Bible...</p>
                        </div>
                    </motion.div>
                )}

                {generatedImageUrl && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, type: 'spring' }}
                        className="w-full rounded-3xl overflow-hidden glass-card shadow-2xl border border-white/10 group relative"
                    >
                        {/* Image with subtle hover zoom */}
                        <div className="overflow-hidden">
                            <img src={generatedImageUrl} alt="Generated result" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                        </div>

                        {/* Quick Actions Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                                <div>
                                    <p className="text-white text-sm font-medium line-clamp-1 max-w-md mb-1">{prompt}</p>
                                    <div className="flex gap-2">
                                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/70">1024x1024</span>
                                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">V2 Model</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-colors border border-white/10">
                                        Download
                                    </button>
                                    <button onClick={() => router.push('/dashboard/canvas')} className="px-6 py-2.5 bg-primary text-black hover:bg-primary/90 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-primary/20">
                                        Edit in Canvas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
