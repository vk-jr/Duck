'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Filter, Download, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Brand {
    id: string
    name: string
}

interface GeneratedImage {
    id: string
    image_url: string
    user_prompt: string
    brand_id: string
}

export default function GalleryClient({
    images,
    brands
}: {
    images: GeneratedImage[],
    brands: Brand[]
}) {
    const [selectedBrandId, setSelectedBrandId] = useState<string>('ALL')

    const filteredImages = selectedBrandId === 'ALL'
        ? images
        : images.filter(img => img.brand_id === selectedBrandId)

    const handleDownload = async (e: React.MouseEvent, imageUrl: string, prompt: string) => {
        try {
            e.preventDefault()
            const response = await fetch(imageUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            const filename = `generated-${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.png`
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Download failed:', error)
            window.open(imageUrl, '_blank')
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight text-white">My Gallery</h2>
                    <p className="text-muted-foreground">Your collection of AI-generated assets.</p>
                </div>

                {/* Brand Filter */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 max-w-full no-scrollbar">
                    <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                    <button
                        onClick={() => setSelectedBrandId('ALL')}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                            selectedBrandId === 'ALL'
                                ? "bg-white text-black"
                                : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                        )}
                    >
                        All Brands
                    </button>
                    {brands.map(brand => (
                        <button
                            key={brand.id}
                            onClick={() => setSelectedBrandId(brand.id)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                                selectedBrandId === brand.id
                                    ? "bg-white text-black"
                                    : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                            )}
                        >
                            {brand.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredImages.map((image) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            key={image.id}
                            className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-all"
                        >
                            {image.image_url && (
                                <img
                                    src={image.image_url}
                                    alt={image.user_prompt || 'Generated Image'}
                                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                />
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                                    {image.user_prompt}
                                </p>
                                <div className="flex gap-2 justify-between items-end">
                                    <span className="text-xs text-white/50 bg-black/50 px-2 py-1 rounded">
                                        {brands.find(b => b.id === image.brand_id)?.name || 'Unknown Brand'}
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => handleDownload(e, image.image_url, image.user_prompt)}
                                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg backdrop-blur-sm transition-colors border border-white/10 flex items-center gap-1.5"
                                        >
                                            <Download className="w-3 h-3" />
                                            Download
                                        </button>
                                        <a
                                            href={image.image_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg backdrop-blur-sm transition-colors border border-white/10 flex items-center gap-1.5"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            Open
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredImages.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5"
                    >
                        <p>No images found for this brand.</p>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
