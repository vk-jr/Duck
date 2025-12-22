import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function GalleryPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { data: images } = await supabase
        .from('generated_images')
        .select('*')
        .eq('created_by', user.id)
        .eq('status', 'Generated')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-white">My Gallery</h2>
                <p className="text-muted-foreground">Your collection of AI-generated assets.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {images?.map((image) => (
                    <div key={image.id} className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-all">
                        {image.image_url && (
                            <img
                                src={image.image_url}
                                alt={image.user_prompt || 'Generated Image'}
                                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                            />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                            <p className="text-white text-sm font-medium line-clamp-2 mb-2">
                                {image.user_prompt}
                            </p>
                            <div className="flex gap-2">
                                <a
                                    href={image.image_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg backdrop-blur-sm transition-colors border border-white/10"
                                >
                                    Open Full
                                </a>
                            </div>
                        </div>
                    </div>
                ))}

                {(!images || images.length === 0) && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5">
                        <p>No images generated yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
