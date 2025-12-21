'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    return (
        <div className="min-h-screen bg-black text-white relative flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            {/* 
              Main Content Wrapper
              Dynamically adjusts margin-left based on sidebar state.
              Using Framer Motion for smooth layout transition to match sidebar spring.
            */}
            <motion.main
                initial={{ marginLeft: 256 }}
                animate={{ marginLeft: isCollapsed ? 80 : 256 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex-1 min-h-screen transition-all"
            >
                {children}
            </motion.main>
        </div>
    )
}
