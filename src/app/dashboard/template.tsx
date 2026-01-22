'use client'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { motion } from 'framer-motion'

export default function RootDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <DashboardShell>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full h-full"
            >
                {children}
            </motion.div>
        </DashboardShell>
    )
}
