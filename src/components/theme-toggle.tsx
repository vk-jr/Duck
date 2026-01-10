"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="w-14 h-8 rounded-full bg-muted border border-border" />
        )
    }

    const isDark = theme === "dark"

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`
        relative inline-flex h-8 w-16 items-center rounded-full
        transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        border border-border
        ${isDark ? "bg-zinc-800" : "bg-zinc-200"}
      `}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            <span className="sr-only">Toggle theme</span>

            {/* Track Icons */}
            <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
                <Sun className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-500' : 'opacity-0'} transition-opacity`} />
                <Moon className={`w-3.5 h-3.5 ${!isDark ? 'text-zinc-400' : 'opacity-0'} transition-opacity`} />
            </div>

            {/* Handle */}
            <span
                className={`
          absolute flex items-center justify-center
          h-6 w-6 rounded-full bg-background shadow-md ring-0 transition-all duration-300 ease-spring
          ${isDark ? "translate-x-9" : "translate-x-1"}
        `}
            >
                {isDark ? (
                    <Moon className="h-3.5 w-3.5 text-foreground fill-current" />
                ) : (
                    <Sun className="h-3.5 w-3.5 text-orange-500 fill-current" />
                )}
            </span>
        </button>
    )
}
