import Link from 'next/link'
import { Plus, Sparkles, Layers, ArrowRight } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Fetch latest 4 generated images
    const { data: images } = await supabase
        .from('generated_images')
        .select('*')
        .eq('created_by', user?.id)
        .eq('status', 'Generated')
        .order('created_at', { ascending: false })
        .limit(4)

    return (
        <div className="space-y-8">
            {/* Hero / Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-serif font-bold tracking-tight text-foreground mb-2">Welcome back, Creator</h2>
                    <p className="text-muted-foreground">Here is what's happening with your brand assets today.</p>
                </div>

                <div className="flex gap-3 items-center">
                    <ThemeToggle />
                    <Link href="/dashboard/brand/create">
                        <button className="flex items-center gap-2 bg-card text-foreground border border-border font-bold px-6 py-3 rounded-xl hover:bg-secondary transition-colors">
                            <Plus className="w-5 h-5" />
                            New Brand
                        </button>
                    </Link>
                    <Link href="/dashboard/generator">
                        <button className="flex items-center gap-2 bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                            <Sparkles className="w-5 h-5" />
                            New Generation
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats / Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-4 group cursor-pointer hover:border-primary/20 hover:shadow-sm transition-all">
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-foreground font-serif">Generator</h3>
                        <p className="text-sm text-muted-foreground">Create on-brand assets in seconds.</p>
                    </div>
                </div>
                <div className="bg-card border border-border p-6 rounded-2xl flex flex-col gap-4 group cursor-pointer hover:border-primary/20 hover:shadow-sm transition-all">
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-foreground font-serif">Content Beta Canvas</h3>
                        <p className="text-sm text-muted-foreground">Deconstruct and segment your images.</p>
                    </div>
                </div>
                <div className="bg-secondary/50 border border-dashed border-border p-6 rounded-2xl flex flex-col justify-center items-center gap-2 hover:border-primary/50 transition-colors">
                    <p className="text-muted-foreground text-sm">Brand Knowledge Base</p>
                    <span className="text-2xl font-bold text-foreground">124 Assets</span>
                </div>
            </div>

            {/* Recent Generations Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground font-serif">Recent Creations</h3>
                    <Link href="/dashboard/gallery" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {images?.map((image) => (
                        <div key={image.id} className="aspect-[3/4] rounded-2xl bg-secondary overflow-hidden relative group border border-border">
                            {image.image_url && (
                                <img
                                    src={image.image_url}
                                    alt={image.user_prompt || "Generated Image"}
                                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                                />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                <div className="flex gap-2">
                                    <Link href={image.image_url} target="_blank" className="flex-1">
                                        <button className="w-full bg-secondary/80 backdrop-blur text-white py-2 rounded-lg font-medium text-xs hover:bg-secondary border border-white/10 transition-colors">
                                            Open
                                        </button>
                                    </Link>
                                    <Link href="/dashboard/canvas" className="flex-1">
                                        <button className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-bold text-xs hover:bg-primary/90 transition-colors">
                                            Canvas
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!images || images.length === 0) && (
                        <div className="col-span-full h-32 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                            <p>No recent creations found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
