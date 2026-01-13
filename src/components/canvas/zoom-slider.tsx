import React, { useRef, useState } from 'react'
import { useReactFlow, useViewport } from 'reactflow'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ZoomSlider() {
    const { zoomTo, zoomIn, zoomOut } = useReactFlow()
    const { zoom } = useViewport()
    const [isDragging, setIsDragging] = useState(false)

    // Constraints
    const MIN_ZOOM = 0.1
    const MAX_ZOOM = 4

    // Calculate percentage (0 to 1)
    const percent = (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)
    const clampedPercent = Math.min(Math.max(percent, 0), 1)

    const trackRef = useRef<HTMLDivElement>(null)

    const updateZoomFromPointer = (e: React.PointerEvent) => {
        if (!trackRef.current) return
        const rect = trackRef.current.getBoundingClientRect()
        // Calculate Y relative to the bottom of the track (Up = Max Zoom)
        const height = rect.height
        const y = rect.bottom - e.clientY
        const rawPercent = y / height
        const p = Math.min(Math.max(rawPercent, 0), 1)

        const newZoom = MIN_ZOOM + (p * (MAX_ZOOM - MIN_ZOOM))
        zoomTo(newZoom, { duration: 0 })
    }

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true)
        updateZoomFromPointer(e)
        // Capture pointer to handle dragging even if cursor leaves element
        e.currentTarget.setPointerCapture(e.pointerId)
    }

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return
        updateZoomFromPointer(e)
    }

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false)
        e.currentTarget.releasePointerCapture(e.pointerId)
    }

    return (
        <div className="absolute left-6 bottom-6 z-50 flex flex-col items-center gap-3 bg-zinc-950/90 backdrop-blur-md border border-white/5 rounded-full p-1.5 py-3 shadow-2xl transition-all hover:border-white/10">
            <button
                onClick={() => zoomIn({ duration: 300 })}
                className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                title="Zoom In"
            >
                <Plus className="w-4 h-4" />
            </button>

            {/* Slider Track Area */}
            <div
                ref={trackRef}
                className="relative w-8 h-32 flex justify-center cursor-pointer touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                {/* Track Line */}
                <div className="absolute top-0 bottom-0 w-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    {/* Fill Gradient */}
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/50 to-primary w-full transition-all duration-75 ease-out"
                        style={{ height: `${clampedPercent * 100}%` }}
                    />
                </div>

                {/* Draggable Thumb/Glow */}
                <div
                    className={cn(
                        "absolute w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all duration-75 ease-out",
                        isDragging ? "scale-125" : "hover:scale-110"
                    )}
                    style={{
                        bottom: `calc(${clampedPercent * 100}% - 8px)`, // Center thumb vertically on the point
                    }}
                />
            </div>

            <button
                onClick={() => zoomOut({ duration: 300 })}
                className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
                title="Zoom Out"
            >
                <Minus className="w-4 h-4" />
            </button>

            {/* Zoom Level Readout */}
            <div className="text-[9px] font-mono text-zinc-500 font-bold tracking-tighter select-none">
                {Math.round(zoom * 100)}%
            </div>
        </div>
    )
}
