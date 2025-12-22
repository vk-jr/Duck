import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Bird } from 'lucide-react'

function ImageNode({ data }: { data: { label: string, src: string, type: 'layer' | 'background' } }) {
    return (
        <div className="relative group">
            {/* Minimal Image Container */}
            <div className="rounded-lg overflow-hidden border-2 border-transparent group-hover:border-primary/50 ring-1 ring-white/10 shadow-2xl transition-all bg-black">
                {!data.src ? (
                    <div className="p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-zinc-900">
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
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 backdrop-blur px-3 py-1 rounded-full text-[10px] font-medium text-white border border-white/10 z-20 pointer-events-none">
                {data.label}
            </div>

            {/* Badge */}
            {data.type && (
                <div className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-400 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {data.type}
                </div>
            )}

            {/* Handles */}
            <Handle type="target" position={Position.Top} className="opacity-0 group-hover:opacity-100 !bg-primary !w-3 !h-3 !border-2 !border-black transition-opacity" />
            <Handle type="source" position={Position.Bottom} className="opacity-0 group-hover:opacity-100 !bg-primary !w-3 !h-3 !border-2 !border-black transition-opacity" />
        </div>
    )
}

export default memo(ImageNode)
