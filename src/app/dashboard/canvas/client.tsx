'use client'

import { useState, useCallback, useRef } from 'react'
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
    useReactFlow
} from 'reactflow'
import 'reactflow/dist/style.css'
import ImageNode from '@/components/canvas/image-node'
import CanvasSidebar from '@/components/canvas/canvas-sidebar'
import { Wand2, Save, Upload, MousePointer2, PanelRightOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

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

function CanvasContent({ images }: { images: GeneratedImage[] }) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const { project } = useReactFlow()

    const [isSidebarOpen, setIsSidebarOpen] = useState(true)

    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    )

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [])

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
                data: { label: prompt, src: imageUrl, type: 'asset' },
            }

            setNodes((nds) => nds.concat(newNode))
        },
        [project, setNodes]
    )

    return (
        <div className="flex h-[calc(100vh-6rem)] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/90 relative">

            <div className="flex-1 relative h-full order-1" ref={reactFlowWrapper}>
                {/* Empty State Watermark */}
                {nodes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <div className="text-center opacity-20 select-none">
                            <h1 className="text-6xl font-black text-white tracking-tighter mb-4">CANVAS</h1>
                            <p className="text-xl font-light text-white uppercase tracking-[0.5em]">Drag Assets Here</p>
                        </div>
                    </div>
                )}
                {/* Canvas Toolbar */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <div className="bg-black/50 backdrop-blur border border-white/10 rounded-lg p-1 flex">
                        <div className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-white/80 border-r border-white/10">
                            <MousePointer2 className="w-3 h-3" /> Select
                        </div>
                        <div className="px-3 py-1.5 flex items-center gap-2 text-xs font-medium text-white/50 hover:bg-white/5 cursor-pointer transition-colors">
                            <Upload className="w-3 h-3" /> Upload
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform text-sm">
                        <Save className="w-4 h-4" /> Save Board
                    </button>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="bg-white/10 text-white p-2 rounded-lg hover:bg-white/20 transition-colors"
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

                    className="bg-gray-900/10"
                >
                    <Controls className="!bg-black/50 !border-white/10 !fill-white !rounded-lg !overflow-hidden [&>button]:!border-b-white/10 last:[&>button]:!border-b-0 !left-4 !bottom-4 !transform-none" />
                    <MiniMap
                        className="!bg-black/80 !border-white/10 !rounded-lg !overflow-hidden !bottom-4 !right-4 !left-auto !m-0 shadow-xl"
                        nodeColor="#EAB308"
                        maskColor="rgba(0, 0, 0, 0.4)"
                        zoomable
                        pannable
                    />
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
                </ReactFlow>
            </div>

            {/* Right Sidebar */}
            <div className={cn(
                "order-2 border-l border-white/10 bg-black/40 transition-all duration-300 overflow-hidden",
                isSidebarOpen ? "w-80" : "w-0 border-l-0"
            )}>
                <div className="w-80 h-full"> {/* Inner Constrained Width */}
                    <CanvasSidebar images={images} />
                </div>
            </div>
        </div>
    )
}

export default function CanvasClient({ images }: { images: GeneratedImage[] }) {
    return (
        <ReactFlowProvider>
            <CanvasContent images={images} />
        </ReactFlowProvider>
    )
}
