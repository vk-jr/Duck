'use client'

import React, { useEffect, useState } from 'react'
import { History, Trash2, RotateCcw, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getCanvasStates, deleteCanvasState } from '@/app/dashboard/canvas/actions'

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
}

interface CanvasState {
    id: string
    updated_at: string
    nodes: any[]
    edges: any[]
    viewport: any
}

interface MemoryPanelProps {
    isOpen: boolean
    onClose: () => void
    onRestore: (state: CanvasState) => void
}

export default function MemoryPanel({ isOpen, onClose, onRestore }: MemoryPanelProps) {
    const [states, setStates] = useState<CanvasState[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchStates = async () => {
        setIsLoading(true)
        const result = await getCanvasStates()
        if (result.success && result.data) {
            setStates(result.data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        if (isOpen) {
            fetchStates()
        }
    }, [isOpen])

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setDeletingId(id)
        const result = await deleteCanvasState(id)
        if (result.success) {
            setStates(prev => prev.filter(s => s.id !== id))
        }
        setDeletingId(null)
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 20 }}
                        className="absolute right-0 top-0 bottom-0 w-80 bg-card border-l border-border z-50 flex flex-col shadow-2xl"
                    >
                        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                            <div className="flex items-center gap-2">
                                <History className="w-4 h-4 text-primary" />
                                <h3 className="font-bold text-foreground">Canvas Memory</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-32 text-muted-foreground">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                            ) : states.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No saved states yet.</p>
                                    <p className="text-xs opacity-60">Canvas auto-saves as you work.</p>
                                </div>
                            ) : (
                                states.map((state) => (
                                    <div
                                        key={state.id}
                                        onClick={() => onRestore(state)}
                                        className="group relative bg-secondary/30 hover:bg-secondary border border-border rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                {state.nodes?.length || 0} Nodes
                                            </span>
                                            <button
                                                onClick={(e) => handleDelete(e, state.id)}
                                                disabled={deletingId === state.id}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-all"
                                                title="Delete State"
                                            >
                                                {deletingId === state.id ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3 h-3" />
                                                )}
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <RotateCcw className="w-3 h-3" />
                                            Saved {formatTimeAgo(state.updated_at)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
