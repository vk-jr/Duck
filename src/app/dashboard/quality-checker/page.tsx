'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Palette, ShieldCheck, ArrowRight, Wand2, ScanSearch } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function QualityCheckerPage() {
    return (
        <div className="flex flex-col gap-8 h-[calc(100vh-8rem)] relative">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-[5000ms]" />
                <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] mix-blend-screen animate-pulse duration-[7000ms]" />
            </div>

            <div className="flex flex-col gap-2 relative z-10">
                <h1 className="text-4xl font-serif font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Brand Intelligence
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    Define your visual identity and ensure every asset meets your standards.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0 relative z-10">
                {/* Create Brand Guidelines Card */}
                <Link href="/dashboard/quality-checker/create" className="group h-full">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-10 flex flex-col justify-between transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_50px_-12px_rgba(var(--primary-rgb),0.2)] group-hover:scale-[1.01]"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-bl-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute -right-12 -top-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 rotate-12">
                            <Palette className="w-96 h-96 text-primary" />
                        </div>

                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 p-[1px] mb-8 shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow duration-500">
                                <div className="w-full h-full rounded-2xl bg-black/90 flex items-center justify-center backdrop-blur-md">
                                    <Wand2 className="w-10 h-10 text-primary-foreground" />
                                </div>
                            </div>

                            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:text-primary transition-colors duration-300">
                                Create Guidelines
                            </h2>
                            <p className="text-muted-foreground text-lg leading-relaxed max-w-md group-hover:text-foreground/80 transition-colors duration-300">
                                Architect your brand's DNA. Define valid color palettes, typography rules, and logo usage to create a single source of truth.
                            </p>
                        </div>

                        <div className="relative z-10 flex items-center gap-3 text-primary font-semibold mt-auto pt-10">
                            <span className="text-lg group-hover:underline decoration-2 underline-offset-4">Open Designer</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                    </motion.div>
                </Link>

                {/* Check Guidelines Card */}
                <Link href="/dashboard/quality-checker/check" className="group h-full">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                        className="h-full relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-10 flex flex-col justify-between transition-all duration-500 hover:border-blue-500/50 hover:shadow-[0_0_50px_-12px_rgba(59,130,246,0.2)] group-hover:scale-[1.01]"
                    >
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-blue-500/10 via-blue-500/5 to-transparent rounded-bl-[100%] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="absolute -right-12 -top-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 -rotate-12">
                            <ShieldCheck className="w-96 h-96 text-blue-500" />
                        </div>

                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-[1px] mb-8 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow duration-500">
                                <div className="w-full h-full rounded-2xl bg-black/90 flex items-center justify-center backdrop-blur-md">
                                    <ScanSearch className="w-10 h-10 text-white" />
                                </div>
                            </div>

                            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:text-blue-500 transition-colors duration-300">
                                Quality Audit
                            </h2>
                            <p className="text-muted-foreground text-lg leading-relaxed max-w-md group-hover:text-foreground/80 transition-colors duration-300">
                                Instantly verify assets against your guidelines. Detect color mismatches, spacing violations, and style inconsistencies with AI.
                            </p>
                        </div>

                        <div className="relative z-10 flex items-center gap-3 text-blue-500 font-semibold mt-auto pt-10">
                            <span className="text-lg group-hover:underline decoration-2 underline-offset-4">Start Audit</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                    </motion.div>
                </Link>
            </div>
        </div>
    )
}
