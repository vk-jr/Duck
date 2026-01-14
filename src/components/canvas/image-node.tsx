import { memo } from 'react'
import { Handle, Position, useReactFlow } from 'reactflow'
import { Bird, X, Pencil, Wand2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function ImageNode({ id, data }: { id: string, data: { label: string, src: string, type: 'layer' | 'background', status?: string, onEdit?: (id: string) => void } }) {
    const { setNodes } = useReactFlow()

    const deleteNode = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent selecting the node when clicking delete
        setNodes((nodes) => nodes.filter((n) => n.id !== id))
    }

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (data.onEdit) {
            data.onEdit(id)
        }
    }

    return (
        <div className="relative group">
            {/* Minimal Image Container */}
            <div className={cn(
                "rounded-lg overflow-hidden border-2 border-transparent group-hover:border-primary/50 ring-1 ring-white/10 shadow-none transition-none bg-zinc-900 transform-gpu backface-hidden translate-z-0",
                data.status === 'generating' && "ring-primary/50 border-primary/20"
            )}>
                {data.status === 'generating' ? (
                    <div className="w-[300px] h-[300px] flex flex-col items-center justify-center gap-4 bg-black/90 relative overflow-hidden ring-1 ring-white/10">

                        {/* Matrix/Grid Background Effect */}
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                        </div>

                        {/* Scanning Beam */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_15px_rgba(234,179,8,0.8)] animate-[scan_2s_ease-in-out_infinite]" />

                        {/* Central Animated Icon */}
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-xl border border-primary/30 flex items-center justify-center bg-primary/5 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
                                <Wand2 className="w-8 h-8 text-primary animate-pulse" />
                            </div>
                            {/* Orbiting Particles */}
                            <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
                                <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(234,179,8,0.8)] -translate-x-1/2 -translate-y-1/2"></div>
                            </div>
                        </div>

                        {/* Status Text with Typing/Pulse */}
                        <div className="space-y-1 text-center z-10">
                            <div className="text-sm font-bold text-primary tracking-widest uppercase">
                                Initializing
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono animate-pulse">
                                Processing Backend Request...
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-2 z-10">
                            <div className="h-full bg-primary/80 animate-[progress_2s_ease-in-out_infinite] w-full origin-left" />
                        </div>
                    </div>
                ) : !data.src ? (
                    <div className="p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-zinc-900 min-w-[200px] min-h-[200px]">
                        <Bird className="w-8 h-8 opacity-20" />
                        <span className="text-[10px]">No Image</span>
                    </div>
                ) : (
                    // Natural aspect ratio, max width
                    <img
                        src={data.src}
                        alt={data.label}
                        className="max-w-[300px] h-auto block object-cover"
                        draggable={false}
                    />
                )}
            </div>

            {/* Floating Label (Visible on Hover) */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/90 px-3 py-1 rounded-full text-[10px] font-medium text-white border border-white/10 z-20 pointer-events-none">
                {data.label}
            </div>

            {/* Edit Button */}
            <button
                onClick={handleEdit}
                className="absolute -top-3 -left-3 bg-secondary hover:bg-secondary/80 text-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-30 border border-border"
                title="Edit"
            >
                <Pencil className="w-3 h-3" />
            </button>

            {/* Delete Button */}
            <button
                onClick={deleteNode}
                className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-30"
                title="Remove"
            >
                <X className="w-3 h-3" />
            </button>

            {/* Badge */}
            {data.type && (
                <div className="absolute -top-2 left-2 bg-zinc-800 text-zinc-400 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden">
                    {data.type}
                </div>
            )}

            {/* Handles */}
            <Handle type="target" position={Position.Left} className="opacity-0 group-hover:opacity-100 !bg-primary !w-3 !h-3 !border-2 !border-black transition-opacity" />
            <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100 !bg-primary !w-3 !h-3 !border-2 !border-black transition-opacity" />
        </div>
    )
}

export default memo(ImageNode)
