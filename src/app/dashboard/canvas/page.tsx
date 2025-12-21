'use client'

import { useState, useCallback } from 'react'
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
    BackgroundVariant
} from 'reactflow'
import 'reactflow/dist/style.css'
import ImageNode from '@/components/canvas/image-node'
import { Wand2, Save } from 'lucide-react'

// Register custom node types
const nodeTypes = {
    imageNode: ImageNode,
}

const initialNodes: Node[] = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Drop an image to start' }, type: 'input' },
]

export default function CanvasPage() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState([])

    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    )

    // MOCK: Function to simulate "Deconstruct/Scatter" behavior
    const scatterNodes = () => {
        const newNodes: Node[] = [
            {
                id: 'bg',
                type: 'imageNode',
                position: { x: 0, y: 0 },
                data: { label: 'Studio Background', type: 'background', src: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=300&q=80' }
            },
            {
                id: 'obj1',
                type: 'imageNode',
                position: { x: 250, y: -100 },
                data: { label: 'Perfume Bottle', type: 'layer', src: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&q=80' }
            },
            {
                id: 'note1',
                position: { x: 450, y: 50 },
                data: { label: '✨ AI Note: Lighting matches "Golden Hour" style' },
                style: { background: '#FEF08A', color: 'black', width: 150, fontSize: 11, borderRadius: 8, padding: 10, border: 'none' }
            }
        ]

        const newEdges: Edge[] = [
            { id: 'e1-2', source: 'bg', target: 'obj1', animated: true, style: { stroke: '#EAB308' } },
            { id: 'e2-3', source: 'obj1', target: 'note1', style: { stroke: '#EAB308', strokeDasharray: 5 } }
        ]

        setNodes(newNodes)
        setEdges(newEdges)
    }

    return (
        <div className="h-[calc(100vh-6rem)] w-full relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Canvas Toolbar */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <button
                    onClick={scatterNodes}
                    className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform"
                >
                    <Wand2 className="w-4 h-4" /> Scatter
                </button>
                <button className="flex items-center gap-2 bg-white/10 backdrop-blur-md text-white font-medium px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
                    <Save className="w-4 h-4" /> Save
                </button>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                className="bg-black/90"
            >
                <Controls className="!bg-black/50 !border-white/10 !fill-white" />
                <MiniMap className="!bg-black/50 !border-white/10" nodeColor="#EAB308" />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#333" />
            </ReactFlow>
        </div>
    )
}
