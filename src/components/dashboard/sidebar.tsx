'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutGrid,
    Sparkles,
    Palette,
    Sliders,
    Bird,
    LogOut,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    ScanEye,
    Image as ImageIcon
} from 'lucide-react'

const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutGrid },
    { name: 'Generator', href: '/dashboard/generator', icon: Sparkles },
    { name: 'Canvas', href: '/dashboard/canvas', icon: Palette },
    { name: 'Gallery', href: '/dashboard/gallery', icon: ImageIcon },
    { name: 'Quality Checker', href: '/dashboard/quality-checker', icon: ScanEye },
    { name: 'Brands', href: '/dashboard/brand/create', icon: Briefcase },
    { name: 'Settings', href: '/dashboard/settings', icon: Sliders },
]

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()

    return (
        <motion.div
            initial={{ width: 256 }}
            animate={{ width: isCollapsed ? 80 : 256 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="h-screen border-r border-border bg-card/80 backdrop-blur-xl fixed left-0 top-0 z-50 flex flex-col"
        >
            <div className={cn("flex h-16 items-center border-b border-border transition-all", isCollapsed ? "justify-center" : "px-6")}>
                <Link href="/dashboard" className="flex items-center gap-3 font-bold text-xl tracking-tight overflow-hidden whitespace-nowrap">
                    <div className="w-8 h-8 min-w-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                        <Bird className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="text-foreground font-serif overflow-hidden"
                            >
                                Duck
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>
            </div>

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-12 z-50 p-1 bg-card border border-border rounded-full shadow-md text-muted-foreground hover:text-foreground hover:scale-110 transition-all"
            >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            <nav className="flex-1 flex flex-col gap-2 p-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.name === 'Brands' && pathname.includes('/brand'))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                isCollapsed && "justify-center"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />

                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="truncate"
                                    >
                                        {item.name}
                                    </motion.span>
                                )}
                            </AnimatePresence>

                            {/* Tooltip for collapsed state */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl border border-border/50">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-3 mt-auto">
                <button
                    onClick={async () => {
                        const supabase = createClient()
                        await supabase.auth.signOut()
                        router.push('/login')
                        router.refresh()
                    }}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all group overflow-hidden",
                        isCollapsed && "justify-center"
                    )}
                >
                    <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                Sign Out
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.div>
    )
}
