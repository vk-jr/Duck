import { GripVertical } from 'lucide-react'

interface GeneratedImage {
    id: string
    image_url: string
    user_prompt: string
}

export default function CanvasSidebar({ images }: { images: GeneratedImage[] }) {
    const onDragStart = (event: React.DragEvent, nodeType: string, imageUrl: string, prompt: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType)
        event.dataTransfer.setData('application/imageurl', imageUrl)
        event.dataTransfer.setData('application/prompt', prompt)
        event.dataTransfer.effectAllowed = 'move'
    }

    return (
        <aside className="w-64 border-r border-white/10 bg-black/40 flex flex-col h-full">
            <div className="p-4 border-b border-white/10">
                <h2 className="font-semibold text-white">Assets</h2>
                <p className="text-xs text-muted-foreground">Drag to canvas</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                {images.map((img) => (
                    <div
                        key={img.id}
                        className="group relative aspect-square rounded-xl overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 hover:border-primary/50 transition-all bg-white/5"
                        onDragStart={(event) => onDragStart(event, 'imageNode', img.image_url, img.user_prompt)}
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
            </div>
        </aside>
    )
}
