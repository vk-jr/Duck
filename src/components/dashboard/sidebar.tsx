'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
    LayoutDashboard,
    ImagePlus,
    Layers,
    Settings,
    Bird,
    LogOut,
    Palette,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Generator', href: '/dashboard/generator', icon: ImagePlus },
    { name: 'Canvas', href: '/dashboard/canvas', icon: Layers },
    { name: 'Gallery', href: '/dashboard/gallery', icon: ImagePlus },
    { name: 'Brands', href: '/dashboard/brand/create', icon: Palette },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
    const pathname = usePathname()

    return (
        <motion.div
            initial={{ width: 256 }}
            animate={{ width: isCollapsed ? 80 : 256 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-screen border-r border-border bg-card/80 backdrop-blur-xl fixed left-0 top-0 z-50 flex flex-col"
        >
            <div className={cn("flex h-16 items-center border-b border-border", isCollapsed ? "justify-center" : "px-6")}>
                <Link href="/dashboard" className="flex items-center gap-3 font-bold text-xl tracking-tight overflow-hidden whitespace-nowrap">
                    <div className="w-8 h-8 min-w-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                        <Bird className="w-5 h-5 text-primary-foreground" />
                    </div>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-foreground font-serif"
                        >
                            Duck
                        </motion.span>
                    )}
                </Link>
            </div>

            <nav className="flex-1 flex flex-col gap-2 p-3">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.name === 'Brands' && pathname.includes('/brand'))
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                                isCollapsed && "justify-center"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />

                            {!isCollapsed && (
                                <span className="truncate">{item.name}</span>
                            )}

                            {/* Tooltip for collapsed state */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg border border-border">
                                    {item.name}
                                </div>
                            )}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-3 border-t border-border">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                <button className={cn("flex items-center gap-3 px-3 py-3 w-full rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors", isCollapsed && "justify-center")}>
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!isCollapsed && <span>Sign Out</span>}
                </button>
            </div>
        </motion.div>
    )
}
