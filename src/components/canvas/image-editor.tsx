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

type Transform = {
    x: number
    y: number
    width?: number
    height?: number
}

// Resize Handle Component
const ResizeHandle = ({
    position,
    onMouseDown
}: {
    position: 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw',
    onMouseDown: (e: React.MouseEvent, pos: string) => void
}) => {
    const cursorMap = {
        n: 'ns-resize',
        s: 'ns-resize',
        e: 'ew-resize',
        w: 'ew-resize',
        ne: 'nesw-resize',
        nw: 'nwse-resize',
        se: 'nwse-resize',
        sw: 'nesw-resize'
    }

    const styleMap: Record<string, string> = {
        n: 'top-0 left-1/2 -ml-1.5 -mt-1.5',
        s: 'bottom-0 left-1/2 -ml-1.5 -mb-1.5',
        e: 'right-0 top-1/2 -mt-1.5 -mr-1.5',
        w: 'left-0 top-1/2 -mt-1.5 -ml-1.5',
        ne: 'top-0 right-0 -mt-1.5 -mr-1.5',
        nw: 'top-0 left-0 -mt-1.5 -ml-1.5',
        se: 'bottom-0 right-0 -mb-1.5 -mr-1.5',
        sw: 'bottom-0 left-0 -mb-1.5 -ml-1.5'
    }

    return (
        <div
            className={cn(
                "absolute w-3 h-3 bg-white border border-primary rounded-full z-20 hover:scale-125 transition-transform",
                styleMap[position]
            )}
            style={{ cursor: cursorMap[position] }}
            onMouseDown={(e) => onMouseDown(e, position)}
        />
    )
}

export default function ImageEditor({ baseImage, layers, onExit, activeLayerId, onLayerSelect, activeRectangle, onRectangleChange, isProcessing }: ImageEditorProps & {
    activeRectangle?: { x: number, y: number, width: number, height: number } | null
    onRectangleChange?: (rect: { x: number, y: number, width: number, height: number } | null) => void
    isProcessing?: boolean
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [layerTransforms, setLayerTransforms] = useState<Record<string, Transform>>({})
    const [aspectRatio, setAspectRatio] = useState<number | null>(null)

    // Interaction State
    const [isDragging, setIsDragging] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [resizeHandle, setResizeHandle] = useState<string | null>(null)

    // Drawing State
    const [isDrawingMode, setIsDrawingMode] = useState(false)
    const [isDrawing, setIsDrawing] = useState(false)
    const [drawStart, setDrawStart] = useState({ x: 0, y: 0 })
    const [currentDrawRect, setCurrentDrawRect] = useState<{ x: number, y: number, width: number, height: number } | null>(null)

    // Initial Capture for delta calculation
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const [initialTransform, setInitialTransform] = useState<Transform>({ x: 0, y: 0 })

    // Measure base image on load
    const onBaseImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { naturalWidth, naturalHeight } = e.currentTarget
        if (naturalHeight > 0) {
            setAspectRatio(naturalWidth / naturalHeight)
        }
    }

    // Initialize/Capture dimensions if missing
    const getOrInitTransform = (layerId: string, element: HTMLElement) => {
        const current = layerTransforms[layerId]
        if (current && current.width !== undefined && current.height !== undefined) {
            return current
        }

        // Capture natural size if first time interacting
        // We use offsetWidth/Height from the rendered element
        return {
            x: current?.x || 0,
            y: current?.y || 0,
            width: element.offsetWidth,
            height: element.offsetHeight
        }
    }


    const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
        if (isDrawingMode || isProcessing) return // Don't select layers when drawing or processing
        e.stopPropagation()
        onLayerSelect(layerId)

        // Ensure we have dimensions captured
        const element = e.currentTarget as HTMLElement
        const transform = getOrInitTransform(layerId, element)
        setInitialTransform(transform)
        setLayerTransforms(prev => ({ ...prev, [layerId]: transform }))

        setIsDragging(true)
        setDragStart({ x: e.clientX, y: e.clientY })
    }

    const handleResizeStart = (e: React.MouseEvent, position: string) => {
        e.stopPropagation()
        if (!activeLayerId) return

        setIsResizing(true)
        setResizeHandle(position)
        setDragStart({ x: e.clientX, y: e.clientY })

        // We know we have full transform because handles only show for active (which sets init on select)
        // verify existence just in case
        const current = layerTransforms[activeLayerId]
        if (current) {
            setInitialTransform(current)
        }
    }

    // Drawing Handlers
    const handleDrawStart = (e: React.MouseEvent) => {
        if (!isDrawingMode || !containerRef.current || isProcessing) return
        e.stopPropagation()

        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        setIsDrawing(true)
        setDrawStart({ x, y })
        setCurrentDrawRect({ x, y, width: 0, height: 0 })
    }

    const handleDrawMove = (e: MouseEvent) => {
        if (!isDrawing || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const currentX = e.clientX - rect.left
        const currentY = e.clientY - rect.top

        const width = currentX - drawStart.x
        const height = currentY - drawStart.y

        setCurrentDrawRect({
            x: width > 0 ? drawStart.x : currentX,
            y: height > 0 ? drawStart.y : currentY,
            width: Math.abs(width),
            height: Math.abs(height)
        })
    }

    const handleDrawEnd = () => {
        if (!isDrawing || !currentDrawRect) return

        setIsDrawing(false)

        // Calculate original image coordinates
        if (containerRef.current && aspectRatio) {
            const containerWidth = containerRef.current.offsetWidth
            const containerHeight = containerRef.current.offsetHeight

            // We need natural dimensions. We can get them from the image element inside
            const imgElement = containerRef.current.querySelector('img') as HTMLImageElement
            if (imgElement) {
                const scaleX = imgElement.naturalWidth / containerWidth
                const scaleY = imgElement.naturalHeight / containerHeight

                const originalRect = {
                    x: Math.round(currentDrawRect.x * scaleX),
                    y: Math.round(currentDrawRect.y * scaleY),
                    width: Math.round(currentDrawRect.width * scaleX),
                    height: Math.round(currentDrawRect.height * scaleY)
                }

                if (onRectangleChange) {
                    onRectangleChange(originalRect)
                }
            }
        }
    }

    // Global listeners for robust drag/resize/draw
    useEffect(() => {
        if (isDragging || isResizing || isDrawing) {
            const onWindowMove = (e: MouseEvent) => {
                if (isDrawing) handleDrawMove(e)
                else handleMouseMove(e)
            }
            const onWindowUp = () => {
                if (isDrawing) handleDrawEnd()
                else handleMouseUp()
            }

            window.addEventListener('mousemove', onWindowMove)
            window.addEventListener('mouseup', onWindowUp)

            return () => {
                window.removeEventListener('mousemove', onWindowMove)
                window.removeEventListener('mouseup', onWindowUp)
            }
        }
    }, [isDragging, isResizing, isDrawing, dragStart, activeLayerId, initialTransform, resizeHandle, drawStart, currentDrawRect])
    // Added dependencies to ensure closure has latest state

    const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
        if (!activeLayerId) return

        const clientX = 'clientX' in e ? e.clientX : (e as unknown as MouseEvent).clientX
        const clientY = 'clientY' in e ? e.clientY : (e as unknown as MouseEvent).clientY

        const dx = clientX - dragStart.x
        const dy = clientY - dragStart.y

        if (isDragging) {
            setLayerTransforms(prev => ({
                ...prev,
                [activeLayerId]: {
                    ...initialTransform,
                    x: initialTransform.x + dx,
                    y: initialTransform.y + dy
                }
            }))
        }
        else if (isResizing && initialTransform.width && initialTransform.height) {
            // ... (rest of resize logic same)
            // Calculate new geometry based on handle
            let newX = initialTransform.x
            let newY = initialTransform.y
            let newW = initialTransform.width
            let newH = initialTransform.height

            // Horizontal logic
            if (resizeHandle?.includes('e')) {
                newW = Math.max(20, initialTransform.width + dx) // Min width 20
            }
            if (resizeHandle?.includes('w')) {
                const proposedW = initialTransform.width - dx
                if (proposedW > 20) {
                    newW = proposedW
                    newX = initialTransform.x + dx
                }
            }

            // Vertical logic
            if (resizeHandle?.includes('s')) {
                newH = Math.max(20, initialTransform.height + dy)
            }
            if (resizeHandle?.includes('n')) {
                const proposedH = initialTransform.height - dy
                if (proposedH > 20) {
                    newH = proposedH
                    newY = initialTransform.y + dy
                }
            }

            setLayerTransforms(prev => ({
                ...prev,
                [activeLayerId]: {
                    x: newX,
                    y: newY,
                    width: newW,
                    height: newH
                }
            }))
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
        setIsResizing(false)
        setResizeHandle(null)
    }

    // Scale rectangle for display
    const getDisplayRect = () => {
        if (isDrawing) return currentDrawRect
        if (activeRectangle && containerRef.current) {
            const imgElement = containerRef.current.querySelector('img') as HTMLImageElement
            if (imgElement) {
                const scaleX = containerRef.current.offsetWidth / imgElement.naturalWidth
                const scaleY = containerRef.current.offsetHeight / imgElement.naturalHeight

                return {
                    x: activeRectangle.x * scaleX,
                    y: activeRectangle.y * scaleY,
                    width: activeRectangle.width * scaleX,
                    height: activeRectangle.height * scaleY
                }
            }
        }
        return null
    }

    const displayRect = getDisplayRect()

    return (
        <div
            className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col pt-16 md:pt-0 transition-all"
        // Removed onMouseMove, onMouseUp, onMouseLeave from here
        >
            {/* Toolbar */}
            <div className="absolute top-4 left-4 z-50 flex gap-2">
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors border border-border"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                <button
                    onClick={() => {
                        setIsDrawingMode(!isDrawingMode)
                        // Clear active layer when entering draw mode
                        if (!isDrawingMode) onLayerSelect(null)
                    }}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border",
                        isDrawingMode ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-secondary/80"
                    )}
                >
                    <Move className="w-4 h-4" />
                    Draw Rectangle
                </button>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider bg-background/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/5">
                    {isDrawingMode ? 'Drawing Mode' : 'Editing Mode'}
                </div>
            </div>

            {/* Main Editing Area */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">

                {/* Responsive Container locked to aspect ratio */}
                <div
                    ref={containerRef}
                    onMouseDown={isDrawingMode ? handleDrawStart : undefined}
                    className={cn(
                        "relative shadow-2xl rounded-lg overflow-hidden border border-border bg-black/5",
                        isDrawingMode && "cursor-crosshair"
                    )}
                    style={{
                        width: '100%',
                        height: '100%',
                        maxHeight: '90vh',
                        maxWidth: aspectRatio ? `calc(90vh * ${aspectRatio})` : '100%',
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
                        const transform = layerTransforms[layer.id] || { x: 0, y: 0 }
                        const isActive = activeLayerId === layer.id

                        return (
                            <div
                                key={layer.id}
                                onMouseDown={(e) => handleMouseDown(e, layer.id)}
                                className={cn(
                                    "absolute select-none",
                                    isActive ? "ring-2 ring-primary ring-opacity-100 z-10" : "hover:ring-1 hover:ring-primary/50"
                                )}
                                style={{
                                    transform: `translate(${transform.x}px, ${transform.y}px)`,
                                    width: transform.width, // Undefined = auto
                                    height: transform.height,
                                    top: 0,
                                    left: 0,
                                }}
                            >
                                <img
                                    src={layer.layer_url}
                                    alt={layer.metadata?.prompt || 'layer'}
                                    className="w-full h-full object-contain pointer-events-none block"
                                    draggable={false}
                                />

                                {/* Resize Handles (Only when active) */}
                                {isActive && (
                                    <>
                                        <ResizeHandle position="nw" onMouseDown={handleResizeStart} />
                                        <ResizeHandle position="ne" onMouseDown={handleResizeStart} />
                                        <ResizeHandle position="sw" onMouseDown={handleResizeStart} />
                                        <ResizeHandle position="se" onMouseDown={handleResizeStart} />
                                        <ResizeHandle position="n" onMouseDown={handleResizeStart} />
                                        <ResizeHandle position="s" onMouseDown={handleResizeStart} />
                                        <ResizeHandle position="e" onMouseDown={handleResizeStart} />
                                        <ResizeHandle position="w" onMouseDown={handleResizeStart} />
                                    </>
                                )}
                            </div>
                        )
                    })}

                    {/* Drawn Rectangle Overlay */}
                    {displayRect && (
                        <div
                            className={cn(
                                "absolute border-2 z-20 pointer-events-none overflow-hidden",
                                isProcessing ? "border-amber-500 bg-amber-500/10" : "border-red-500 bg-red-500/20"
                            )}
                            style={{
                                left: displayRect.x,
                                top: displayRect.y,
                                width: displayRect.width,
                                height: displayRect.height
                            }}
                        >
                            {/* Scanning Animation */}
                            {isProcessing && (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/50 to-transparent animate-[shimmer_2s_infinite] -translate-y-full" style={{
                                        animation: 'scan 2s linear infinite'
                                    }} />
                                    <style jsx>{`
                                        @keyframes scan {
                                            0% { transform: translateY(-100%); }
                                            100% { transform: translateY(100%); }
                                        }
                                    `}</style>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-lg" />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
