'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, CheckCircle, AlertCircle, Loader2, ShieldCheck, Image as ImageIcon, GripVertical, Layers, Sparkles } from 'lucide-react'
import { getBrands, createQualityCheck, getQualityCheck, getUserAssets, getWorkflowLog } from '@/app/actions/quality-checker'
import { cn } from '@/lib/utils'

interface Brand {
    id: string
    name: string
}

interface Asset {
    id: string
    image_url?: string // Generated Images
    layer_url?: string // Image Layers
    user_prompt?: string
    status: string
}

export default function CheckGuidelinesPage() {
    const [brands, setBrands] = useState<Brand[]>([])
    const [assets, setAssets] = useState<{ images: Asset[], layers: Asset[] }>({ images: [], layers: [] })
    const [selectedBrand, setSelectedBrand] = useState<string>('')
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [droppedUrl, setDroppedUrl] = useState<string | null>(null)
    const [isDragOver, setIsDragOver] = useState(false)
    const [isChecking, setIsChecking] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'generated' | 'layers'>('generated')
    const pollInterval = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        async function loadData() {
            const [brandsData, assetsData] = await Promise.all([
                getBrands(),
                getUserAssets()
            ])
            setBrands(brandsData)
            setAssets(assetsData)
        }
        loadData()

        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current)
        }
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setPreviewUrl(URL.createObjectURL(selectedFile))
            setDroppedUrl(null)
            setResult(null)
            setError(null)
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

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const selectedFile = e.dataTransfer.files[0]
            setFile(selectedFile)
            setPreviewUrl(URL.createObjectURL(selectedFile))
            setDroppedUrl(null)
            setResult(null)
            setError(null)
            return
        }

        const imageUrl = e.dataTransfer.getData('text/plain')
        if (imageUrl) {
            setFile(null)
            setPreviewUrl(imageUrl)
            setDroppedUrl(imageUrl)
            setResult(null)
            setError(null)
        }
    }

    const handleDragStart = (e: React.DragEvent, url: string) => {
        e.dataTransfer.setData('text/plain', url)
        e.dataTransfer.effectAllowed = 'copy'
    }

    const startPolling = (checkId: string, logId?: string) => {
        if (pollInterval.current) clearInterval(pollInterval.current)

        pollInterval.current = setInterval(async () => {
            // 1. Check Entity Status (Primary Source of Truth)
            const check = await getQualityCheck(checkId)

            if (check) {
                // Happy Path: Processing Code 200 OR Status 'completed'
                if ((check.processing_code === 200 || check.status?.toLowerCase() === 'completed') && check.result) {
                    setResult(check.result)
                    setIsChecking(false)
                    if (pollInterval.current) clearInterval(pollInterval.current)
                    return
                }

                // Error Path: Processing Code indicates error OR Status 'failed'
                // If processing_code is present and NOT 200 (and not null/0), it's likely an error if status isn't generating?
                // Actually user said: "if it says 200 you should proceed... if it shows an error... show that message"
                // So if processing_code is NOT 200 and NOT null, it might be an error?
                // Let's assume > 299 is error.
                if ((check.processing_code && check.processing_code >= 400) || check.status?.toLowerCase() === 'failed' || check.status?.toLowerCase() === 'error') {
                    setError(check.error_message || 'Quality check failed')
                    setIsChecking(false)
                    if (pollInterval.current) clearInterval(pollInterval.current)
                    return
                }
            }

            // 2. Fallback: Check Log Status (Secondary Debug Info)
            if (logId) {
                const log = await getWorkflowLog(logId)
                if (log && (log.execution_status === 'ERROR' || log.status_category === 'API_ERROR' || log.status_category === 'CONFIG_ERROR')) {
                    setError(log.message || 'Workflow failed')
                    setIsChecking(false)
                    if (pollInterval.current) clearInterval(pollInterval.current)
                    return
                }
            }
        }, 3000)
    }

    const handleCheck = async () => {
        if (!file && !droppedUrl) return

        setIsChecking(true)
        setResult(null)
        setError(null)

        const formData = new FormData()
        if (file) formData.append('image', file)
        if (droppedUrl) formData.append('imageUrl', droppedUrl)
        formData.append('brandId', selectedBrand)

        try {
            const response = await createQualityCheck(formData)

            if (response.success && response.data?.id) {
                startPolling(response.data.id, response.logId)
            } else {
                setError(response.error || 'Something went wrong')
                setIsChecking(false)
            }
        } catch (err) {
            setError('An unexpected error occurred')
            setIsChecking(false)
        }
    }

    const formatKey = (key: string) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).replace(/_/g, ' ')
    }

    const ResultDisplay = ({ data }: { data: any }) => {
        if (typeof data !== 'object' || data === null) {
            return <span className='font-medium text-foreground'>{String(data)}</span>
        }

        if (Array.isArray(data)) {
            if (data.length === 0) return <span className="text-muted-foreground italic">None</span>
            return (
                <ul className="list-disc pl-5 space-y-1">
                    {data.map((item, idx) => (
                        <li key={idx}><ResultDisplay data={item} /></li>
                    ))}
                </ul>
            )
        }

        return (
            <div className="space-y-3 pl-4 border-l-2 border-border/50">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key} className="text-sm">
                        <span className='text-muted-foreground font-medium'>{formatKey(key)}:</span>{' '}
                        <div className="mt-1">
                            <ResultDisplay data={value} />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="flex gap-6 h-[calc(100vh-8rem)]">
            {/* Main Content Area */}
            <div className="flex-1 flex gap-6 min-w-0">
                {/* Left Panel - Input */}
                <div className="w-1/2 flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl font-serif font-bold tracking-tight mb-2">Check Guidelines</h1>
                        <p className="text-muted-foreground">Upload or drag an asset to verify compliance.</p>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium">Select Brand</label>
                        <select
                            className="w-full p-4 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                        >
                            <option value="">-- Choose a Brand --</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>{brand.name}</option>
                            ))}
                        </select>
                    </div>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={cn(
                            "flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all duration-300 relative overflow-hidden group",
                            (isDragOver || file || droppedUrl)
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
                                    <p className="font-bold text-xl mb-2">Drag & Drop Asset</p>
                                    <p className="text-muted-foreground text-sm max-w-[200px] mx-auto">
                                        Upload from computer or drag directly from your assets sidebar
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleCheck}
                        disabled={(!file && !droppedUrl) || isChecking}
                        className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-[0.98]"
                    >
                        {isChecking ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Checking Compliance...
                            </>
                        ) : (
                            <>
                                <ShieldCheck className="w-6 h-6" />
                                Run Quality Check
                            </>
                        )}
                    </button>
                </div>

                {/* Middle Panel - Results */}
                <div className="w-1/2 bg-card/50 backdrop-blur-sm rounded-3xl border border-border p-8 flex flex-col overflow-y-auto relative shadow-sm">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 sticky top-0 bg-card/95 p-2 -mx-2 backdrop-blur-md z-10 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        Analysis Results
                    </h2>

                    {error && (
                        <div className="p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-3 animate-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {isChecking && !result && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground animate-pulse">
                            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />
                            <p className="font-medium text-lg text-foreground">Analyzing Compliance...</p>
                            <p className="text-sm mt-2">Checking against brand guidelines</p>
                        </div>
                    )}

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm">
                                <ResultDisplay data={result} />
                            </div>
                        </motion.div>
                    )}

                    {!isChecking && !result && !error && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground opacity-30">
                            <ShieldCheck className="w-24 h-24 mb-6 stroke-1" />
                            <p className="text-lg font-medium">Results will appear here</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Assets (Redesigned) */}
            <div className="w-80 border-l border-border bg-card/30 backdrop-blur-xl p-6 flex flex-col rounded-l-3xl shadow-2xl border-y border-l hidden xl:flex">
                <div className="mb-6">
                    <h3 className="font-serif text-2xl font-bold mb-1 tracking-tight flex items-center gap-2">
                        Assets
                        <Sparkles className="w-4 h-4 text-primary" />
                    </h3>
                    <p className="text-xs text-muted-foreground">Drag items to analyze</p>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 bg-muted/60 rounded-xl mb-6 backdrop-blur-sm border border-white/5">
                    <button
                        onClick={() => setActiveTab('generated')}
                        className={cn(
                            "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                            activeTab === 'generated'
                                ? "bg-background shadow-md text-primary ring-1 ring-black/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Images
                    </button>
                    <button
                        onClick={() => setActiveTab('layers')}
                        className={cn(
                            "flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                            activeTab === 'layers'
                                ? "bg-background shadow-md text-primary ring-1 ring-black/5"
                                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                        )}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        Layers
                    </button>
                </div>

                {/* Asset Grid */}
                <div className="flex-1 overflow-y-auto -mr-4 pr-4 customized-scrollbar space-y-4">
                    <div className="grid grid-cols-2 gap-3 pb-4">
                        <AnimatePresence mode="popLayout">
                            {activeTab === 'generated' ? (
                                assets.images.length > 0 ? (
                                    assets.images.map((img) => (
                                        <motion.div
                                            key={img.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            layout
                                            draggable
                                            onDragStart={(e) => handleDragStart(e as any, img.image_url || '')}
                                            className="aspect-square rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing hover:ring-2 ring-primary ring-offset-2 ring-offset-card relative group bg-muted/20 shadow-sm border border-border/50 transition-all hover:shadow-lg hover:-translate-y-1"
                                        >
                                            {img.image_url && (
                                                <img
                                                    src={img.image_url}
                                                    alt="Asset"
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end pb-4">
                                                <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/30 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                    <GripVertical className="w-3 h-3" />
                                                    Drag
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center text-muted-foreground p-4 bg-muted/20 rounded-2xl border border-dashed border-border/60">
                                        <ImageIcon className="w-10 h-10 mb-3 opacity-30" />
                                        <p className="text-sm font-medium">No images yet</p>
                                        <p className="text-xs opacity-60 mt-1">Generate some first!</p>
                                    </div>
                                )
                            ) : (
                                assets.layers.length > 0 ? (
                                    assets.layers.map((layer) => (
                                        <motion.div
                                            key={layer.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            layout
                                            draggable
                                            onDragStart={(e) => handleDragStart(e as any, layer.layer_url || '')}
                                            className="aspect-square rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing hover:ring-2 ring-primary ring-offset-2 ring-offset-card relative group bg-muted/20 shadow-sm border border-border/50 transition-all hover:shadow-lg hover:-translate-y-1"
                                        >
                                            {layer.layer_url && (
                                                <img
                                                    src={layer.layer_url}
                                                    alt="Layer"
                                                    className="w-full h-full object-cover"
                                                    loading="lazy"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end pb-4">
                                                <div className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/30 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                    <GripVertical className="w-3 h-3" />
                                                    Drag
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center text-muted-foreground p-4 bg-muted/20 rounded-2xl border border-dashed border-border/60">
                                        <Layers className="w-10 h-10 mb-3 opacity-30" />
                                        <p className="text-sm font-medium">No layers found</p>
                                        <p className="text-xs opacity-60 mt-1">Process canvas items first!</p>
                                    </div>
                                )
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}
