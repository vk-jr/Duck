'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
    ReactFlowProvider,
    useReactFlow,
    Viewport
} from 'reactflow'
import 'reactflow/dist/style.css'
import ImageNode from '@/components/canvas/image-node'
import CanvasSidebar from '@/components/canvas/canvas-sidebar'
import MemoryPanel from '@/components/canvas/memory-panel'
import { Wand2, Save, Upload, MousePointer2, PanelRightOpen, History, Maximize, Minimize } from 'lucide-react'
import { cn } from '@/lib/utils'
import { processCanvasImage, saveCanvasState } from './actions'
import ImageEditor from '@/components/canvas/image-editor'

// Register custom node types
const nodeTypes = {
    imageNode: ImageNode,
}

// Start empty
const initialNodes: Node[] = []

interface GeneratedImage {
    id: string
    image_url: string
    user_prompt: string
}

interface ImageLayer {
    id: string
    layer_url: string
    layer_type: string
    status: string
    metadata: any
    created_at: string
    generated_image_id?: string
}

function CanvasContent({ images, layers }: { images: GeneratedImage[], layers: ImageLayer[] }) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const { project, getViewport, setViewport } = useReactFlow()

    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isMemoryOpen, setIsMemoryOpen] = useState(false)
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Edit Mode State
    const [editModeData, setEditModeData] = useState<{
        imageId: string
        baseImage: string
        layers: ImageLayer[]
    } | null>(null)
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null)


    // Canvas Container Ref for Fullscreen
    const canvasContainerRef = useRef<HTMLDivElement>(null)

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            canvasContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    // Update state on fullscreen change
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Track pending generations: Map<layerId, { sourceNodeId: string, instruction: string }>
    const pendingGenerations = useRef<Map<string, { sourceNodeId: string, instruction: string }>>(new Map())

    // Auto-save Logic
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const triggerSave = useCallback(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

        saveTimeoutRef.current = setTimeout(async () => {
            const viewport = getViewport()

            // Sanitize nodes to remove non-serializable properties (like internal symbols)
            const sanitizedNodes = nodes.map(node => ({
                id: node.id,
                type: node.type,
                position: node.position,
                data: node.data,
                width: node.width,
                height: node.height,
                selected: node.selected,
                positionAbsolute: node.positionAbsolute,
                dragging: node.dragging
            }))

            const sanitizedEdges = edges.map(edge => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle,
                targetHandle: edge.targetHandle,
                animated: edge.animated,
                style: edge.style,
                markerEnd: edge.markerEnd,
                type: edge.type,
                data: edge.data,
                selected: edge.selected
            }))

            const state = {
                nodes: JSON.parse(JSON.stringify(sanitizedNodes)), // Deep copy to ensure no refs
                edges: JSON.parse(JSON.stringify(sanitizedEdges)),
                viewport
            }

            // Only save if there's something to save
            if (nodes.length === 0 && edges.length === 0) return

            console.log('Auto-saving canvas state...')
            const result = await saveCanvasState(state)
            if (result.success) {
                setLastSaved(new Date())
            }
        }, 2000) // Debounce 2s
    }, [nodes, edges, getViewport])

    // Trigger save on changes
    useEffect(() => {
        triggerSave()
    }, [nodes, edges, triggerSave])

    const onRestoreState = useCallback((state: any) => {
        if (state.nodes) setNodes(state.nodes)
        if (state.edges) setEdges(state.edges)
        if (state.viewport) setViewport(state.viewport)
        setIsMemoryOpen(false)
    }, [setNodes, setEdges, setViewport])


    // Listen for Realtime Updates from Supabase
    React.useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel('canvas-layer-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'image_layers',
                },
                (payload: any) => {
                    const layer = payload.new
                    if (layer.status?.toLowerCase() !== 'generated') return
                    const pending = pendingGenerations.current.get(layer.id)
                    if (pending) updatePendingNode(pending.sourceNodeId, layer)
                }
            )
            .subscribe()

        // Helper to update node (shared by Realtime and Polling)
        const updatePendingNode = (sourceNodeId: string, layer: any) => {
            setNodes((currentNodes) => currentNodes.map(node => {
                if (node.id === sourceNodeId) {
                    // Only update if it's still generating
                    if (node.data.status !== 'generating') return node

                    return {
                        ...node,
                        data: {
                            ...node.data,
                            src: layer.layer_url,
                            status: 'generated',
                            label: layer.metadata?.prompt || node.data.label
                        }
                    }
                }
                return node
            }))

            setEdges((currentEdges) => currentEdges.map(edge => {
                if (edge.target === sourceNodeId) {
                    return {
                        ...edge,
                        style: { stroke: '#EAB308', strokeWidth: 2 }
                    }
                }
                return edge
            }))

            pendingGenerations.current.delete(layer.id)
        }

        // Polling Fallback (Every 3 seconds)
        // This ensures that even if Realtime RLS fails, we can still fetch the image
        const intervalId = setInterval(async () => {
            if (pendingGenerations.current.size === 0) return

            // Check each pending layer
            for (const [layerId, pending] of Array.from(pendingGenerations.current.entries())) {
                const { getLayerStatus } = await import('./actions') // Dynamic import to avoid server-action build issues in client effect if any
                const result = await getLayerStatus(layerId)

                if (result.success && result.data && result.data.status?.toLowerCase() === 'generated') {
                    // Construct layer-like object from result
                    const layer = {
                        id: layerId,
                        layer_url: result.data.layer_url,
                        metadata: result.data.metadata
                    }
                    updatePendingNode(pending.sourceNodeId, layer)
                }
            }
        }, 3000)


        return () => {
            supabase.removeChannel(channel)
            clearInterval(intervalId)
        }
    }, [setNodes, setEdges])


    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    )

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [])

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node)
        if (!isSidebarOpen) setIsSidebarOpen(true)
    }, [isSidebarOpen])

    // NEW: Handle Edit Button Click
    const { getNodes } = useReactFlow() // Ensure this is destructured

    const onNodeEdit = useCallback((nodeId: string) => {
        const nodes = getNodes() // Get latest nodes without dependency
        const node = nodes.find(n => n.id === nodeId)
        if (!node) return

        const imageId = node.data.imageId || node.data.id // Fallback might be needed if imageId isn't on upload

        // Find links
        // If it's a main image (type=generation/upload usually represented by assetType in Drop, but here we check data)
        // We'll rely on our layers prop to find associated layers

        // Filter layers for this image
        const imageLayers = layers.filter(l => l.generated_image_id === imageId && l.status.toLowerCase() === 'generated')

        setEditModeData({
            imageId: imageId || nodeId, // unique ID for editing session
            baseImage: node.data.src,
            layers: imageLayers
        })
        setActiveLayerId(null)
        setIsSidebarOpen(true) // Ensure sidebar is open for layer selection

    }, [getNodes, layers]) // Removed 'nodes' dependency

    // Inject onEdit into node data
    useEffect(() => {
        setNodes(nds => nds.map(node => {
            if (node.type === 'imageNode' && !node.data.onEdit) {
                return {
                    ...node,
                    data: { ...node.data, onEdit: onNodeEdit }
                }
            }
            return node
        }))
    }, [nodes.length, onNodeEdit, setNodes]) // Check on length or when nodes change broadly


    const onPaneClick = useCallback(() => {
        setSelectedNode(null)
    }, [])


    const handleProcess = async (text: string, type: string) => {
        if (!selectedNode) return

        setIsProcessing(true)
        const imageUrl = selectedNode.data.src
        const imageId = selectedNode.data.imageId || selectedNode.id
        const sourceNodeId = selectedNode.id

        // Create Immediate "Loading" Node
        const tempNodeId = `layer-temp-${Date.now()}`
        const newPosition = {
            x: selectedNode.position.x + 400,
            y: selectedNode.position.y
        }

        const newNode: Node = {
            id: tempNodeId,
            type: 'imageNode',
            position: newPosition,
            data: {
                label: `Generating: ${text}`,
                src: '', // Empty src triggers loading/placeholder in updated ImageNode
                type: 'generated',
                imageId: imageId,
                status: 'generating' // Trigger loading state
            },
        }

        const newEdge: Edge = {
            id: `e-${sourceNodeId}-${tempNodeId}`,
            source: sourceNodeId,
            target: tempNodeId,
            animated: true,
            style: { stroke: '#EAB308', strokeWidth: 2, strokeDasharray: '5,5' }, // Dotted line for pending
        }

        setNodes((nds) => nds.concat(newNode))
        setEdges((eds) => addEdge(newEdge, eds))

        const result = await processCanvasImage({
            imageId,
            imageUrl,
            text,
            type,
            brandId: ''
        })

        setIsProcessing(false)

        if (result.error) {
            alert(result.error)
            // Remove the temp node on error
            setNodes((nds) => nds.filter(n => n.id !== tempNodeId))
            setEdges((eds) => eds.filter(e => e.id !== newEdge.id))
        } else {
            const layerId = result.layerId
            // alert(`Sent to processing engine! Layer ID: ${layerId}`) // Removed alert for smoother flow

            if (layerId) {
                // Map the real Layer ID to our Temp Node ID so we can update it later
                pendingGenerations.current.set(layerId, { sourceNodeId: tempNodeId, instruction: text })

                // OPTIONAL: Update the node ID to match the layer ID? 
                // It's cleaner to keep the temp ID or update it. 
                // For simplicity, we'll keep the temp ID for now and just update its data when the event fires.
                // Actually, let's update the node's internal reference if possible, but ReactFlow IDs are static.
                // We will rely on `pendingGenerations` map: LayerID -> NodeID
            }
        }
    }

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault()

            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
            if (!reactFlowBounds) return

            // handle file uploads (external drag and drop)
            if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
                const file = event.dataTransfer.files[0]
                const reader = new FileReader()
                reader.onload = (e) => {
                    const src = e.target?.result as string
                    const position = project({
                        x: event.clientX - reactFlowBounds.left,
                        y: event.clientY - reactFlowBounds.top,
                    })
                    const newNode: Node = {
                        id: `ext-${Date.now()}`,
                        type: 'imageNode',
                        position,
                        data: { label: file.name, src, type: 'upload' },
                    }
                    setNodes((nds) => nds.concat(newNode))
                }
                reader.readAsDataURL(file)
                return
            }

            // handle sidebar drag and drop
            const type = event.dataTransfer.getData('application/reactflow')
            const imageUrl = event.dataTransfer.getData('application/imageurl')
            const prompt = event.dataTransfer.getData('application/prompt')
            const imageId = event.dataTransfer.getData('application/imageid')
            const assetType = event.dataTransfer.getData('application/type') || 'asset'

            if (typeof type === 'undefined' || !type) {
                return
            }

            const position = project({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            })

            const mainNodeId = `dnd-${Date.now()}`
            const newNode: Node = {
                id: mainNodeId,
                type,
                position,
                data: { label: prompt, src: imageUrl, type: assetType, imageId },
            }

            const newNodes = [newNode]
            const newEdges: Edge[] = []

            // If it's a main image, find and add its layers
            if (assetType === 'generated' && imageId) {
                const relatedLayers = layers.filter(l => l.generated_image_id === imageId && l.status.toLowerCase() === 'generated')

                relatedLayers.forEach((layer, index) => {
                    const layerNodeId = `layer-auto-${layer.id}-${Date.now()}`

                    // Position: Spread out to the right, staggered vertically
                    const layerPosition = {
                        x: position.x + 400 + (index * 50),
                        y: position.y + (index * 300)
                    }

                    newNodes.push({
                        id: layerNodeId,
                        type: 'imageNode',
                        position: layerPosition,
                        data: {
                            label: layer.metadata?.prompt || 'Layer',
                            src: layer.layer_url,
                            type: 'generated',
                            imageId: layer.generated_image_id
                        }
                    })

                    newEdges.push({
                        id: `e-${mainNodeId}-${layerNodeId}`,
                        source: mainNodeId,
                        target: layerNodeId,
                        animated: true,
                    })
                })
            }

            setNodes((nds) => nds.concat(newNodes))
            if (newEdges.length > 0) {
                setEdges((eds) => eds.concat(newEdges))
            }
        },
        [project, setNodes, layers, setEdges]
    )


    return (
        <div ref={canvasContainerRef} className="flex h-[calc(100vh-6rem)] w-full rounded-2xl overflow-hidden border border-border shadow-2xl bg-card relative">

            <div className="flex-1 relative h-full order-1" ref={reactFlowWrapper}>

                {/* Render Image Editor Overlay if in Edit Mode */}
                {editModeData && (
                    <ImageEditor
                        baseImage={editModeData.baseImage}
                        layers={editModeData.layers}
                        activeLayerId={activeLayerId}
                        onLayerSelect={setActiveLayerId}
                        onExit={() => {
                            setEditModeData(null)
                            setActiveLayerId(null)
                        }}
                    />
                )}

                {/* Empty State Watermark */}
                {nodes.length === 0 && !editModeData && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <div className="text-center opacity-10 select-none">
                            <h1 className="text-6xl font-black text-foreground tracking-tighter mb-4">CANVAS</h1>
                            <p className="text-xl font-light text-muted-foreground uppercase tracking-[0.5em]">Drag Assets Here</p>
                        </div>
                    </div>
                )}

                {/* Canvas Toolbar */}
                {!editModeData && (
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                        <div className="bg-secondary/80 backdrop-blur border border-border rounded-lg p-1 flex">
                            <div className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-foreground/80 border-r border-border">
                                <MousePointer2 className="w-3 h-3" /> Select
                            </div>
                            <div className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground hover:bg-accent cursor-pointer transition-colors">
                                <Upload className="w-3 h-3" /> Upload
                            </div>
                        </div>
                        {/* Memory/History Button */}
                        <button
                            onClick={() => setIsMemoryOpen(true)}
                            className="bg-secondary/80 backdrop-blur border border-border rounded-lg p-2 text-foreground/80 hover:bg-accent transition-colors flex items-center gap-2"
                            title="Canvas Memory"
                        >
                            <History className="w-4 h-4" />
                            <span className="text-xs font-medium hidden md:block">Memory</span>
                        </button>
                        {lastSaved && (
                            <div className="flex items-center text-[10px] text-muted-foreground bg-secondary/50 px-2 rounded-lg backdrop-blur">
                                Saved
                            </div>
                        )}
                    </div>
                )}

                {/* Right Top Toolbar */}
                {!editModeData && (
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <button
                            onClick={toggleFullscreen}
                            className="bg-secondary/80 text-foreground p-2 rounded-lg hover:bg-accent transition-colors border border-border"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                        </button>
                        <button className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform text-sm">
                            <Save className="w-4 h-4" /> Save Board
                        </button>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="bg-secondary/80 text-foreground p-2 rounded-lg hover:bg-accent transition-colors border border-border"
                            title="Toggle Assets"
                        >
                            <PanelRightOpen className={cn("w-5 h-5 transition-transform", isSidebarOpen && "rotate-180")} />
                        </button>
                    </div>
                )}


                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    onMoveEnd={triggerSave} // Trigger save when viewport changes end
                    nodeTypes={nodeTypes}

                    minZoom={0.1}
                    maxZoom={4}
                    fitView

                    panOnScroll={true}
                    selectionOnDrag={true}
                    panOnDrag={true}
                    zoomOnScroll={true}
                    zoomOnPinch={true}
                    zoomOnDoubleClick={true}

                    className="bg-secondary/10"
                >
                    <Controls className="!bg-card !border-border !fill-foreground !rounded-lg !overflow-hidden [&>button]:!border-b-border last:[&>button]:!border-b-0 !left-4 !bottom-4 !transform-none !shadow-xl" />
                    <MiniMap
                        className="!bg-card !border-border !rounded-lg !overflow-hidden !bottom-4 !right-4 !left-auto !m-0 shadow-xl"
                        nodeColor="#EAB308"
                        maskColor="rgba(0, 0, 0, 0.4)"
                        zoomable
                        pannable
                    />
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#888" />
                </ReactFlow>

                {/* Memory Panel */}
                <MemoryPanel
                    isOpen={isMemoryOpen}
                    onClose={() => setIsMemoryOpen(false)}
                    onRestore={onRestoreState}
                />
            </div>

            {/* Right Sidebar */}
            <div className={cn(
                "order-2 border-l border-border bg-card transition-all duration-300 overflow-hidden",
                isSidebarOpen ? "w-80" : "w-0 border-l-0"
            )}>
                <div className="w-80 h-full"> {/* Inner Constrained Width */}
                    <CanvasSidebar
                        images={images}
                        selectedNode={selectedNode}
                        onProcess={handleProcess}
                        isProcessing={isProcessing}
                        layers={layers}
                        // Edit Mode Props
                        editModeLayers={editModeData?.layers}
                        activeLayerId={activeLayerId}
                        onLayerSelect={setActiveLayerId}
                    />
                </div>
            </div>
        </div>
    )
}

export default function CanvasClient({ images, layers }: { images: GeneratedImage[], layers: ImageLayer[] }) {
    return (
        <div className="w-full h-full">
            <ReactFlowProvider>
                <CanvasContent images={images} layers={layers} />
            </ReactFlowProvider>
        </div>
    )
}
