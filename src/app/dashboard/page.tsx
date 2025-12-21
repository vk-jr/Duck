'use client'

import Link from 'next/link'
import { Plus, Sparkles, Layers, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Hero / Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome back, Creator</h2>
                    <p className="text-muted-foreground">Here is what's happening with your brand assets today.</p>
                </div>

                <div className="flex gap-3">
                    <Link href="/dashboard/brand/create">
                        <button className="flex items-center gap-2 bg-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
                            <Plus className="w-5 h-5" />
                            New Brand
                        </button>
                    </Link>
                    <Link href="/dashboard/generator">
                        <button className="flex items-center gap-2 bg-primary text-black font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                            <Sparkles className="w-5 h-5" />
                            New Generation
                        </button>
                    </Link>
                </div>
            </div>

            {/* Stats / Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 group cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">Generator</h3>
                        <p className="text-sm text-muted-foreground">Create on-brand assets in seconds.</p>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 group cursor-pointer hover:bg-white/5 transition-colors">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">Duck Canvas</h3>
                        <p className="text-sm text-muted-foreground">Deconstruct and segment your images.</p>
                    </div>
                </div>
                <div className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center gap-2 border-dashed border-2 border-white/10 hover:border-primary/50 transition-colors">
                    <p className="text-muted-foreground text-sm">Brand Knowledge Base</p>
                    <span className="text-2xl font-bold text-white">124 Assets</span>
                </div>
            </div>

            {/* Recent Generations Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Recent Creations</h3>
                    <Link href="/dashboard/assets" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                <button className="w-full bg-white/10 backdrop-blur-md text-white py-2 rounded-lg font-medium text-sm hover:bg-white/20">
                                    Deconstruct
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
