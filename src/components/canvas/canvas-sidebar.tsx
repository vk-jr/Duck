import { GripVertical, Layers, Wand2, Download } from 'lucide-react'
import { Node } from 'reactflow'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface GeneratedImage {
    id: string
    image_url: string
    user_prompt: string
}

interface ImageLayer {
    id: string
    layer_url: string
    status: string
    metadata: any
}

interface CanvasSidebarProps {
    images: GeneratedImage[]
    layers: ImageLayer[]
    selectedNode: Node | null
    onProcess: (text: string, type: string) => void
    isProcessing: boolean
    editModeLayers?: ImageLayer[] // New Prop
    activeLayerId?: string | null // New Prop
    onLayerSelect?: (id: string | null) => void // New Prop
    activeRectangle?: number[] | null // New Prop
    onDraw?: () => void // New Prop
}

export default function CanvasSidebar({
    images,
    layers = [],
    selectedNode,
    onProcess,
    isProcessing,
    editModeLayers,
    activeLayerId,
    onLayerSelect,
    activeRectangle,
    onDraw
}: CanvasSidebarProps) {
    const [layerText, setLayerText] = useState('')
    const [layerType, setLayerType] = useState('segmentation')
    const [activeTab, setActiveTab] = useState<'assets' | 'layers'>('assets')

    // Force Layers tab if in Edit Mode
    useEffect(() => {
        if (editModeLayers) {
            setActiveTab('layers')
        }
    }, [editModeLayers])

    // Reset input when selection changes
    useEffect(() => {
        setLayerText('')
    }, [selectedNode?.id])

    const onDragStart = (event: React.DragEvent, nodeType: string, imageUrl: string, prompt: string, imageId: string, type: 'generated' | 'layer' = 'generated') => {
        event.dataTransfer.setData('application/reactflow', nodeType)
        event.dataTransfer.setData('application/imageurl', imageUrl)
        event.dataTransfer.setData('application/prompt', prompt)
        event.dataTransfer.setData('application/imageid', imageId)
        event.dataTransfer.setData('application/type', type)
        event.dataTransfer.effectAllowed = 'move'
    }

    // Region vs Text Mode State
    const [segmentationMode, setSegmentationMode] = useState<'region' | 'text'>('region')

    if (selectedNode && selectedNode.type === 'imageNode') {
        return (
            <aside className="w-full h-full border-r border-border bg-card flex flex-col font-sans">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Segmentation
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 truncate" title={selectedNode.data.label}>
                        {selectedNode.data.label || 'Untitled Layer'}
                    </p>
                </div>

                {/* Segmentation Mode Tabs */}
                <div className="flex p-2 gap-2 border-b border-border bg-secondary/20">
                    <button
                        onClick={() => setSegmentationMode('region')}
                        className={cn(
                            "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                            segmentationMode === 'region' ? "bg-background text-primary shadow-sm ring-1 ring-primary/20" : "text-muted-foreground hover:bg-secondary/50"
                        )}
                    >
                        Region (Coordinates)
                    </button>
                    <button
                        onClick={() => setSegmentationMode('text')}
                        className={cn(
                            "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                            segmentationMode === 'text' ? "bg-background text-primary shadow-sm ring-1 ring-primary/20" : "text-muted-foreground hover:bg-secondary/50"
                        )}
                    >
                        Text (Words)
                    </button>
                </div>

                <div className="p-4 space-y-6">

                    {/* REGION MODE UI */}
                    {segmentationMode === 'region' && (
                        <div className="space-y-4">
                            <div className="bg-secondary/50 rounded-lg p-4 border border-border text-center space-y-3">
                                <p className="text-xs text-muted-foreground">
                                    Draw a rectangle on the image to select the object.
                                </p>

                                {activeRectangle ? (
                                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-left">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="text-xs font-bold text-primary">Region Selected</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground font-mono">
                                            <div>X1: {activeRectangle[0]}</div>
                                            <div>Y1: {activeRectangle[1]}</div>
                                            <div>X2: {activeRectangle[2]}</div>
                                            <div>Y2: {activeRectangle[3]}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-amber-500 font-medium flex items-center justify-center gap-2 bg-amber-500/10 p-2 rounded">
                                        <Wand2 className="w-3 h-3" /> No Region Selected
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onDraw?.()
                                    }}
                                    className="w-full bg-secondary hover:bg-secondary/80 text-foreground border border-primary/20 text-xs font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <GripVertical className="w-3 h-3" />
                                    {activeRectangle ? 'Redraw Region' : 'Draw Region'}
                                </button>
                            </div>

                            {isProcessing ? (
                                <div className="w-full bg-secondary/30 rounded-xl overflow-hidden border border-primary/20 p-4 space-y-3 relative">
                                    {/* Shimmer/Pulse Background */}
                                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />

                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <Wand2 className="w-4 h-4 text-primary animate-spin" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="text-xs font-bold text-foreground">Segmenting Object</div>
                                            <div className="text-[10px] text-muted-foreground font-mono animate-pulse">Initializing Backend...</div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden relative z-10">
                                        <div className="h-full bg-primary animate-[progress_2s_ease-in-out_infinite] w-full origin-left" />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => onProcess('', 'rectangle')}
                                    disabled={!activeRectangle}
                                    className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    <Wand2 className="w-4 h-4" />
                                    Segment Region
                                </button>
                            )}
                        </div>
                    )}

                    {/* TEXT MODE UI */}
                    {segmentationMode === 'text' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">What object to segment?</label>
                                <textarea
                                    value={layerText}
                                    onChange={(e) => setLayerText(e.target.value)}
                                    placeholder="e.g. Cat, Red Car, Person..."
                                    className="w-full bg-secondary border border-border rounded-lg p-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none resize-none h-32 placeholder:text-muted-foreground/50"
                                />
                            </div>

                            {isProcessing ? (
                                <div className="w-full bg-secondary/30 rounded-xl overflow-hidden border border-primary/20 p-4 space-y-3 relative">
                                    {/* Shimmer/Pulse Background */}
                                    <div className="absolute inset-0 bg-primary/5 animate-pulse" />

                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <Wand2 className="w-4 h-4 text-primary animate-spin" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="text-xs font-bold text-foreground">Segmenting Object</div>
                                            <div className="text-[10px] text-muted-foreground font-mono animate-pulse">Initializing Backend...</div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden relative z-10">
                                        <div className="h-full bg-primary animate-[progress_2s_ease-in-out_infinite] w-full origin-left" />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => onProcess(layerText, 'segment')}
                                    disabled={!layerText}
                                    className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    <Wand2 className="w-4 h-4" />
                                    Segment Text
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        )
    }

    // Determine what to show in the list
    const displayedLayers = editModeLayers || layers

    return (
        <aside className="w-full h-full border-r border-border bg-card flex flex-col font-sans">
            <div className="p-4 border-b border-border flex justify-between items-center">
                <div>
                    <h2 className="font-semibold text-foreground">{editModeLayers ? 'Edit Mode' : 'Library'}</h2>
                    <p className="text-xs text-muted-foreground">{editModeLayers ? 'Select layer to move' : 'Drag to canvas'}</p>
                </div>
            </div>

            {/* Tabs (Hidden in Edit Mode) */}
            {!editModeLayers && (
                <div className="flex p-2 gap-2 border-b border-border bg-secondary/20">
                    <button
                        onClick={() => setActiveTab('assets')}
                        className={cn(
                            "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                            activeTab === 'assets' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary/50"
                        )}
                    >
                        Assets
                    </button>
                    <button
                        onClick={() => setActiveTab('layers')}
                        className={cn(
                            "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                            activeTab === 'layers' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary/50"
                        )}
                    >
                        Layers
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {activeTab === 'assets' && !editModeLayers ? (
                    <>
                        {images.map((img) => (
                            <div
                                key={img.id}
                                className="group relative aspect-square rounded-xl overflow-hidden cursor-grab active:cursor-grabbing border border-border hover:border-primary/50 transition-all bg-secondary"
                                onDragStart={(event) => onDragStart(event, 'imageNode', img.image_url, img.user_prompt, img.id, 'generated')}
                                draggable
                            >
                                <img
                                    src={img.image_url}
                                    alt={img.user_prompt}
                                    className="w-full h-full object-cover pointer-events-none"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <GripVertical className="text-white w-6 h-6" />
                                </div>
                            </div>
                        ))}
                        {images.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground text-sm">
                                No assets found.<br />Generate some first!
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {displayedLayers.map((layer) => {
                            const isActive = activeLayerId === layer.id
                            return (
                                <div
                                    key={layer.id}
                                    onClick={() => onLayerSelect?.(layer.id)}
                                    className={cn(
                                        "group relative aspect-square rounded-xl overflow-hidden cursor-pointer border transition-all bg-secondary",
                                        isActive ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                                    )}
                                    onDragStart={(event) => !editModeLayers && onDragStart(event, 'imageNode', layer.layer_url, layer.metadata?.prompt || 'Layer', layer.id, 'layer')}
                                    draggable={!editModeLayers} // Disable drag in edit mode? Or maybe allow to re-add? keeping disabled for clarity
                                >
                                    <img
                                        src={layer.layer_url}
                                        alt={layer.metadata?.prompt || 'Layer'}
                                        className="w-full h-full object-cover p-2 pointer-events-none"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-sm">
                                        <p className="text-[10px] text-white/80 truncate">{layer.metadata?.prompt || 'Generated Layer'}</p>
                                    </div>
                                    {!editModeLayers && (
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    window.open(layer.layer_url, '_blank')
                                                }}
                                                className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors"
                                                title="Download Layer"
                                            >
                                                <Download className="w-4 h-4" />
                                            </button>
                                            <GripVertical className="text-white w-6 h-6" />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        {displayedLayers.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground text-sm">
                                No layers found.
                            </div>
                        )}
                    </>
                )}
            </div>
        </aside>
    )
}
