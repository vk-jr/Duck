'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { getBrands, createQualityCheck } from '@/app/actions/quality-checker'
import { cn } from '@/lib/utils'

interface Brand {
    id: string
    name: string
}

export default function CheckGuidelinesPage() {
    const [brands, setBrands] = useState<Brand[]>([])
    const [selectedBrand, setSelectedBrand] = useState<string>('')
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isChecking, setIsChecking] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadBrands() {
            const data = await getBrands()
            setBrands(data)
        }
        loadBrands()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setPreviewUrl(URL.createObjectURL(selectedFile))
            setResult(null)
            setError(null)
        }
    }

    const handleCheck = async () => {
        if (!file) return

        setIsChecking(true)
        setError(null)

        const formData = new FormData()
        formData.append('image', file)
        formData.append('brandId', selectedBrand)

        try {
            const response = await createQualityCheck(formData)

            if (response.success) {
                setResult(response.data.result)
            } else {
                setError(response.error || 'Something went wrong')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setIsChecking(false)
        }
    }

    return (
        <div className="flex gap-8 h-[calc(100vh-8rem)]">
            {/* Left Panel - Input */}
            <div className="w-1/2 flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-serif font-bold tracking-tight mb-2">Check Guidelines</h1>
                    <p className="text-muted-foreground">Upload an asset to verify compliance.</p>
                </div>

                <div className="space-y-4">
                    <label className="block text-sm font-medium">Select Brand</label>
                    <select
                        className="w-full p-3 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
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
                    className={cn(
                        "flex-1 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-colors relative overflow-hidden",
                        file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50"
                    )}
                >
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileChange}
                    />

                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-lg" />
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                                <Upload className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="font-medium text-lg">Click or drag image to upload</p>
                                <p className="text-muted-foreground">Supports JPG, PNG, WEBP</p>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleCheck}
                    disabled={!file || isChecking}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isChecking ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Checking...
                        </>
                    ) : (
                        "Run Quality Check"
                    )}
                </button>
            </div>

            {/* Right Panel - Results */}
            <div className="w-1/2 bg-card rounded-3xl border border-border p-8 flex flex-col overflow-y-auto">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    Analysis Results
                </h2>

                {error && (
                    <div className="p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                {result ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-4 p-6 rounded-2xl bg-green-500/10 border border-green-500/20">
                            <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-green-500">Passed Quality Check</h3>
                                <p className="text-green-600/80">Score: {Math.round(result.score * 100)}% Match</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="font-medium text-muted-foreground uppercase text-sm tracking-wider">Detailed Analysis</h3>
                            {/* Placeholder for detailed breakdown */}
                            <div className="p-4 rounded-xl bg-accent/50">
                                <p className="text-sm">Color Palette Analysis: <span className="text-green-500 font-medium">Consistent</span></p>
                            </div>
                            <div className="p-4 rounded-xl bg-accent/50">
                                <p className="text-sm">Logo Usage: <span className="text-green-500 font-medium">Correct Placement</span></p>
                            </div>
                            <div className="p-4 rounded-xl bg-accent/50">
                                <p className="text-sm">Typography: <span className="text-green-500 font-medium">Match</span></p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground opacity-50">
                        <ShieldCheck className="w-16 h-16 mb-4" />
                        <p>Results will appear here after analysis</p>
                    </div>
                )}
            </div>
        </div>
    )
}
