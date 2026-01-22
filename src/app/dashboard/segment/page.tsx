'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Scissors, Loader2, Image as ImageIcon, Layers, AlertCircle, Download, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createSegmentation, getSegmentations, getSegmentation } from '@/app/actions/segmentation' // Assuming logic is similar
import { getWorkflowLog as fetchWorkflowLog } from '@/app/actions/quality-checker' // Reuse existing if needed or move to shared

// Duplicate simple logger fetch if not exported from segmentation action yet
// For now, I'll assume I can import what I need. 
// I'll stick to the createSegmentation and getSegmentation I defined.

interface Segmentation {
    id: string
    input_image_url: string
    segment_count: number
    status: string
    output_images: string[] | null
    created_at: string
}

export default function SegmentationPage() {
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [segmentCount, setSegmentCount] = useState<number>(4)
    const [isDragOver, setIsDragOver] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [currentSegmentationId, setCurrentSegmentationId] = useState<string | null>(null)
    const [history, setHistory] = useState<Segmentation[]>([])
    const [activeResult, setActiveResult] = useState<Segmentation | null>(null)

    const pollInterval = useRef<NodeJS.Timeout | null>(null)

    // Load History
    useEffect(() => {
        loadHistory()
        return () => stopPolling()
    }, [])

    async function loadHistory() {
        const data = await getSegmentations()
        setHistory(data)
        if (data.length > 0 && !activeResult) {
            setActiveResult(data[0])
        }
    }

    const stopPolling = () => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current)
            pollInterval.current = null
        }
    }

    const startPolling = (id: string) => {
        stopPolling()
        pollInterval.current = setInterval(async () => {
            const data = await getSegmentation(id)
            if (data) {
                if (data.status === 'COMPLETED' || data.status === 'SUCCESS') {
                    stopPolling()
                    setIsProcessing(false)
                    setActiveResult(data)
                    loadHistory()
                } else if (data.status === 'FAILED' || data.status === 'ERROR') {
                    stopPolling()
                    setIsProcessing(false)
                    setError('Segmentation failed. Please try again.')
                } else {
                    // Still generating... update preview state if needed?
                    // For now just wait.
                }
            }
        }, 3000)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setPreviewUrl(URL.createObjectURL(selectedFile))
            setError(null)
            setActiveResult(null)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const selectedFile = e.dataTransfer.files[0]
            setFile(selectedFile)
            setPreviewUrl(URL.createObjectURL(selectedFile))
            setError(null)
            setActiveResult(null)
        }
    }

    const handleSegment = async () => {
        if (!file && !previewUrl) return

        setIsProcessing(true)
        setError(null)

        const formData = new FormData()
        if (file) {
            formData.append('image', file)
        } else {
            // Handle if we support URL input later? For now file is required from drag/drop
            // If dragging from other sidebar functionality is added, we'd need that logic.
            // For now assuming file upload.
            setError('Please upload an image file.')
            setIsProcessing(false)
            return
        }
        formData.append('segmentCount', segmentCount.toString())

        const response = await createSegmentation(formData)

        if (response.success && response.data) {
            setCurrentSegmentationId(response.data.id)
            startPolling(response.data.id)
        } else {
            setError(response.error || 'Failed to start segmentation')
            setIsProcessing(false)
        }
    }

    return (
        <div className="flex gap-6 h-[calc(100vh-8rem)]">
            {/* Left Panel - Input */}
            <div className="w-1/2 flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold tracking-tight mb-2">Image Segmentation</h1>
                    <p className="text-muted-foreground">Split your image into multiple layers/segments.</p>
                </div>

                {/* Settings Card */}
                <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
                    <div className="space-y-4">
                        <label className="block text-sm font-medium flex justify-between">
                            <span>Number of Segments</span>
                            <span className="text-primary font-bold">{segmentCount}</span>
                        </label>
                        <input
                            type="range"
                            min="2"
                            max="8"
                            step="1"
                            value={segmentCount}
                            onChange={(e) => setSegmentCount(parseInt(e.target.value))}
                            className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground px-1">
                            <span>2</span>
                            <span>3</span>
                            <span>4</span>
                            <span>5</span>
                            <span>6</span>
                            <span>7</span>
                            <span>8</span>
                        </div>
                    </div>
                </div>

                {/* Upload Area */}
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all duration-300 relative overflow-hidden group",
                        (isDragOver || file)
                            ? "border-primary bg-primary/5 shadow-inner"
                            : "border-border hover:border-primary/50 hover:bg-accent/30"
                    )}
                >
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        onChange={handleFileChange}
                    />

                    {(previewUrl) ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium z-10 pointer-events-none">
                                Click or Drop to Replace
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-6 pointer-events-none">
                            <div className={cn(
                                "w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-transform duration-500",
                                isDragOver ? "bg-primary/20 scale-110" : "bg-primary/10"
                            )}>
                                <Upload className={cn("w-10 h-10 text-primary transition-all", isDragOver && "animate-bounce")} />
                            </div>
                            <div>
                                <p className="font-bold text-xl mb-2">Drag & Drop Image</p>
                                <p className="text-muted-foreground text-sm max-w-[200px] mx-auto">
                                    Upload the image you want to segment
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSegment}
                    disabled={!file || isProcessing}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Segmenting...
                        </>
                    ) : (
                        <>
                            <Scissors className="w-6 h-6" />
                            Start Segmentation
                        </>
                    )}
                </button>
            </div>

            {/* Right Panel - Results/History */}
            <div className="w-1/2 flex flex-col gap-6">
                <div className="bg-card/50 backdrop-blur-sm rounded-3xl border border-border p-8 flex flex-col h-full overflow-hidden relative shadow-sm">

                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {activeResult ? (
                        <div className="flex flex-col h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-primary" />
                                    Results
                                </h2>
                                <span className="text-xs text-muted-foreground px-3 py-1 bg-muted rounded-full">
                                    {activeResult.segment_count} Segments
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2 pb-4">
                                {/* Original Input */}
                                <div className="col-span-2 relative group rounded-2xl overflow-hidden border border-border/50">
                                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur text-white text-[10px] uppercase font-bold rounded-md z-10">Original</div>
                                    <img src={activeResult.input_image_url} alt="Original" className="w-full h-48 object-cover opacity-80" />
                                </div>

                                {/* Generated Outputs */}
                                {activeResult.output_images && activeResult.output_images.length > 0 ? (
                                    activeResult.output_images.map((imgUrl, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="aspect-square rounded-2xl overflow-hidden bg-muted/20 border border-border/50 relative group"
                                        >
                                            <div className="absolute top-3 left-3 px-2 py-1 bg-primary/80 backdrop-blur text-white text-[10px] uppercase font-bold rounded-md z-10">
                                                Part {idx + 1}
                                            </div>
                                            <img src={imgUrl} alt={`Segment ${idx + 1}`} className="w-full h-full object-contain" />

                                            <a
                                                href={imgUrl}
                                                download={`segment_${idx + 1}.png`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="absolute bottom-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </motion.div>
                                    ))
                                ) : (
                                    ['generating', 'pending', 'processing'].includes(activeResult.status.toLowerCase()) ? (
                                        <div className="col-span-2 py-12 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                                            <Loader2 className="w-8 h-8 animate-spin mb-2 opacity-50" />
                                            <p>Processing segments...</p>
                                        </div>
                                    ) : ['failed', 'error'].includes(activeResult.status.toLowerCase()) ? (
                                        <div className="col-span-2 py-12 flex flex-col items-center justify-center text-destructive/80">
                                            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                            <p>Segmentation Failed</p>
                                        </div>
                                    ) : (
                                        <div className="col-span-2 py-12 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                            <Layers className="w-8 h-8 mb-2" />
                                            <p>No segments found</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground opacity-30">
                            <ImageIcon className="w-24 h-24 mb-6 stroke-1" />
                            <p className="text-lg font-medium">No results to show</p>
                            <p className="text-sm">Upload an image to start</p>
                        </div>
                    )}
                </div>

                {/* Recent History Strip */}
                {history.length > 0 && (
                    <div className="h-24 bg-card border border-border rounded-xl p-3 flex gap-3 overflow-x-auto">
                        {history.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveResult(item)}
                                className={cn(
                                    "aspect-square rounded-lg overflow-hidden border-2 transition-all relative shrink-0",
                                    activeResult?.id === item.id ? "border-primary ring-2 ring-primary/20" : "border-border/50 hover:border-border"
                                )}
                            >
                                <img src={item.input_image_url} alt="Thumb" className="w-full h-full object-cover" />
                                {(item.status === 'COMPLETED' || item.status === 'SUCCESS') && (
                                    <div className="absolute bottom-1 right-1 text-green-500 bg-white rounded-full p-0.5"><CheckCircle className="w-3 h-3 fill-current" /></div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
