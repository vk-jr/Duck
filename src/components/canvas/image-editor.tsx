import React, { useRef, useState, useEffect } from 'react'
import { ArrowLeft, Move } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageLayer {
    id: string
    layer_url: string
    metadata: any
    status: string
}

interface ImageEditorProps {
    baseImage: string
    layers: ImageLayer[]
    onExit: () => void
    activeLayerId: string | null
    onLayerSelect: (id: string | null) => void
}

export default function ImageEditor({ baseImage, layers, onExit, activeLayerId, onLayerSelect }: ImageEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [layerPositions, setLayerPositions] = useState<Record<string, { x: number, y: number }>>({})
    const [aspectRatio, setAspectRatio] = useState<number | null>(null)

    // Initialize drag state
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    // Measure base image on load
    const onBaseImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget
        if (naturalHeight > 0) {
            setAspectRatio(naturalWidth / naturalHeight)
        }
    }

    const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
        e.stopPropagation()
        onLayerSelect(layerId)
        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })

        const currentPos = layerPositions[layerId] || { x: 0, y: 0 }
        setDragOffset(currentPos)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !activeLayerId) return

        const dx = e.clientX - dragStart.x
        const dy = e.clientY - dragStart.y

        setLayerPositions(prev => ({
            ...prev,
            [activeLayerId]: {
                x: dragOffset.x + dx,
                y: dragOffset.y + dy
            }
        }))
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    return (
        <div
            className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col pt-16 md:pt-0 md:pl-80 transition-all"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Toolbar */}
            <div className="absolute top-4 left-4 md:left-84 z-50 flex gap-4 items-center">
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors border border-border"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Canvas
                </button>
                <div className="text-sm text-muted-foreground">
                    Editing Mode
                </div>
            </div>

            {/* Main Editing Area */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">

                {/* Responsive Container locked to aspect ratio */}
                <div
                    ref={containerRef}
                    className="relative shadow-2xl rounded-lg overflow-hidden border border-border bg-black/5"
                    style={{
                        width: '100%',
                        height: '100%',
                        maxHeight: '85vh',
                        maxWidth: aspectRatio ? `calc(85vh * ${aspectRatio})` : '100%',
                        aspectRatio: aspectRatio ? `${aspectRatio}` : 'auto'
                    }}
                >
                    {/* Base Image */}
                    <img
                        src={baseImage}
                        alt="Base"
                        onLoad={onBaseImageLoad}
                        className="w-full h-full object-contain pointer-events-none select-none block"
                    />

                    {/* Layers */}
                    {layers.map((layer) => {
                        const pos = layerPositions[layer.id] || { x: 0, y: 0 }
                        const isActive = activeLayerId === layer.id

                        return (
                            <div
                                key={layer.id}
                                onMouseDown={(e) => handleMouseDown(e, layer.id)}
                                className={cn(
                                    "absolute cursor-move transition-shadow select-none",
                                    isActive && "ring-2 ring-primary ring-opacity-100 z-10"
                                )}
                                style={{
                                    transform: `translate(${pos.x}px, ${pos.y}px)`,
                                    top: 0,
                                    left: 0,
                                }}
                            >
                                <img
                                    src={layer.layer_url}
                                    alt={layer.metadata?.prompt || 'layer'}
                                    className="max-w-none h-auto object-contain pointer-events-none"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%'
                                    }}
                                />
                                {isActive && (
                                    <div className="absolute -top-2 -right-2 p-1 bg-primary text-primary-foreground rounded-full shadow-lg">
                                        <Move className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
