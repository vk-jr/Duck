import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Bird } from 'lucide-react'

function ImageNode({ data }: { data: { label: string, src: string, type: 'layer' | 'background' } }) {
    return (
        <div className="relative group">
            {/* Node Header/Badge */}
            <div className="absolute -top-3 left-3 bg-primary text-black text-[10px] font-bold px-2 py-0.5 rounded-full z-10 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {data.type}
            </div>

            {/* Main Content */}
            <div className="bg-black/80 backdrop-blur-md border px-1 pt-1 pb-3 rounded-xl min-w-[150px] shadow-2xl transition-all hover:border-primary/50">
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-white/5 mb-2">
                    {!data.src ? (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Bird className="w-8 h-8 opacity-20" />
                        </div>
                    ) : (
                        <img src={data.src} alt={data.label} className="w-full h-full object-contain" />
                    )}
                </div>
                <div className="px-1 text-center">
                    <p className="text-xs font-medium text-white truncate">{data.label}</p>
                </div>
            </div>

            {/* Handles */}
            <Handle type="target" position={Position.Top} className="!bg-primary !w-3 !h-3 !border-2 !border-black" />
            <Handle type="source" position={Position.Bottom} className="!bg-primary !w-3 !h-3 !border-2 !border-black" />
        </div>
    )
}

export default memo(ImageNode)
