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
import { Wand2, Save, Upload, MousePointer2 } from 'lucide-react'

// Register custom node types
const nodeTypes = {
    imageNode: ImageNode,
}

const initialNodes: Node[] = [
    {
        id: '1',
        position: { x: 250, y: 250 },
        data: { label: 'Drop images here' },
        type: 'input',
        style: { background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '8px', padding: '10px' }
    },
]

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
        <div className="flex h-[calc(100vh-6rem)] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/90">
            <CanvasSidebar images={images} />

            <div className="flex-1 relative h-full" ref={reactFlowWrapper}>
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

                <div className="absolute top-4 right-4 z-10">
                    <button className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform text-sm">
                        <Save className="w-4 h-4" /> Save Board
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
                    fitView
                    className="bg-black/90"
                >
                    <Controls className="!bg-black/50 !border-white/10 !fill-white" />
                    <MiniMap className="!bg-black/50 !border-white/10" nodeColor="#EAB308" />
                    <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#333" />
                </ReactFlow>
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
