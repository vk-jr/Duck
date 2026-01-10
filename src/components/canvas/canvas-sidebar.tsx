import { GripVertical, Layers, Wand2 } from 'lucide-react'
import { Node } from 'reactflow'
import { useState, useEffect, memo } from 'react'
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
}

function CanvasSidebar({
    images,
    layers = [],
    selectedNode,
    onProcess,
    isProcessing,
    editModeLayers,
    activeLayerId,
    onLayerSelect
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

    if (selectedNode && selectedNode.type === 'imageNode') {
        // ... (Keep existing selected node UI)
        return (
            <aside className="w-full h-full border-r border-border bg-card flex flex-col font-sans">
                <div className="p-4 border-b border-border">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                        <Layers className="w-4 h-4" /> Layer Properties
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1 truncate" title={selectedNode.data.label}>
                        {selectedNode.data.label || 'Untitled Layer'}
                    </p>
                </div>

                <div className="p-4 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Instruction / Text</label>
                        <textarea
                            value={layerText}
                            onChange={(e) => setLayerText(e.target.value)}
                            placeholder="e.g. Remove background, Add shadow..."
                            className="w-full bg-secondary border border-border rounded-lg p-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none resize-none h-32 placeholder:text-muted-foreground/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Action Type</label>
                        <select
                            value={layerType}
                            onChange={(e) => setLayerType(e.target.value)}
                            className="w-full bg-secondary border border-border rounded-lg p-2 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                            <option value="segmentation">Segmentation</option>
                            <option value="generation">Generation</option>
                            <option value="layout">Layout</option>
                        </select>
                    </div>

                    <button
                        onClick={() => onProcess(layerText, layerType)}
                        disabled={isProcessing || !layerText}
                        className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                            <Wand2 className="w-4 h-4" />
                        )}
                        {isProcessing ? 'Processing...' : 'Process Segment'}
                    </button>
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
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
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

export default memo(CanvasSidebar)
