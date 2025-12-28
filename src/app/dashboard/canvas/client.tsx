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
import { Wand2, Save, Upload, MousePointer2, PanelRightOpen, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { processCanvasImage, saveCanvasState } from './actions'

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

    // Track pending generations: Map<layerId, { sourceNodeId: string, instruction: string }>
    const pendingGenerations = useRef<Map<string, { sourceNodeId: string, instruction: string }>>(new Map())

    // Auto-save Logic
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const triggerSave = useCallback(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

        saveTimeoutRef.current = setTimeout(async () => {
            const viewport = getViewport()
            const state = {
                nodes,
                edges,
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
                    console.log('Received Layer Update:', layer)

                    // Check for completion status (case-insensitive)
                    if (layer.status?.toLowerCase() !== 'generated') return

                    const pending = pendingGenerations.current.get(layer.id)
                    if (pending) {
                        const { sourceNodeId, instruction } = pending;

                        // Find Source Node Position
                        setNodes((currentNodes) => {
                            // ... (logic remains same, just ensuring formatting)
                            const sourceNode = currentNodes.find(n => n.id === sourceNodeId)
                            if (!sourceNode) return currentNodes

                            const newNodeId = `layer-${layer.id}`
                            if (currentNodes.some(n => n.id === newNodeId)) return currentNodes

                            const newPosition = {
                                x: sourceNode.position.x + 400,
                                y: sourceNode.position.y
                            }

                            const newNode: Node = {
                                id: newNodeId,
                                type: 'imageNode',
                                position: newPosition,
                                data: {
                                    label: `Generated: ${instruction}`,
                                    src: layer.layer_url,
                                    type: 'generated',
                                    imageId: layer.generated_image_id
                                },
                            }

                            const newEdge: Edge = {
                                id: `e-${sourceNodeId}-${newNodeId}`,
                                source: sourceNodeId,
                                target: newNodeId,
                                animated: true,
                                style: { stroke: '#EAB308', strokeWidth: 2 },
                            }

                            setEdges((eds) => addEdge(newEdge, eds))
                            pendingGenerations.current.delete(layer.id)
                            return [...currentNodes, newNode]
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
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

    const onPaneClick = useCallback(() => {
        setSelectedNode(null)
    }, [])


    const handleProcess = async (text: string, type: string) => {
        if (!selectedNode) return

        setIsProcessing(true)
        const imageUrl = selectedNode.data.src
        const imageId = selectedNode.data.imageId || selectedNode.id
        const sourceNodeId = selectedNode.id

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
        } else {
            const layerId = result.layerId
            alert(`Sent to processing engine! Layer ID: ${layerId}`)

            if (layerId) {
                pendingGenerations.current.set(layerId, { sourceNodeId, instruction: text })
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

            const newNode: Node = {
                id: `dnd-${Date.now()}`,
                type,
                position,
                data: { label: prompt, src: imageUrl, type: assetType, imageId },
            }

            setNodes((nds) => nds.concat(newNode))
        },
        [project, setNodes]
    )

    return (
        <div className="flex h-[calc(100vh-6rem)] w-full rounded-2xl overflow-hidden border border-border shadow-2xl bg-card relative">

            <div className="flex-1 relative h-full order-1" ref={reactFlowWrapper}>
                {/* Empty State Watermark */}
                {nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <div className="text-center opacity-10 select-none">
                            <h1 className="text-6xl font-black text-foreground tracking-tighter mb-4">CANVAS</h1>
                            <p className="text-xl font-light text-muted-foreground uppercase tracking-[0.5em]">Drag Assets Here</p>
                        </div>
                    </div>
                )}

                {/* Canvas Toolbar */}
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

                <div className="absolute top-4 right-4 z-10 flex gap-2">
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
