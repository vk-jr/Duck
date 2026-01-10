"use client"

import * as React from "react"
import { Moon, Sun, Bird } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { setTheme, theme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="w-20 h-9 rounded-full bg-secondary border border-border/50" />
        )
    }

    const currentTheme = theme || "light"

    const cycleTheme = () => {
        if (currentTheme === "light") setTheme("dark")
        else if (currentTheme === "dark") setTheme("brand")
        else setTheme("light")
    }

    // Calculate handle position
    const getTranslateClass = () => {
        if (currentTheme === "dark") return "translate-x-8"
        if (currentTheme === "brand") return "translate-x-[3.25rem]" // approx 52px
        return "translate-x-1"
    }

    return (
        <button
            onClick={cycleTheme}
            className={`
                relative inline-flex h-9 w-[5.5rem] items-center rounded-full
                transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                border border-border/50
                bg-secondary/50 backdrop-blur-sm
            `}
            title={`Current theme: ${currentTheme}`}
        >
            <span className="sr-only">Toggle theme</span>

            {/* Track Icons (Static indicators) */}
            <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none text-muted-foreground/30">
                <div className="w-4 flex justify-center"><Sun className="w-3 h-3" /></div>
                <div className="w-4 flex justify-center"><Moon className="w-3 h-3" /></div>
                <div className="w-4 flex justify-center"><Bird className="w-3 h-3" /></div>
            </div>

            {/* Handle */}
            <span
                className={`
                    absolute flex items-center justify-center
                    h-7 w-7 rounded-full bg-background shadow-lg ring-1 ring-black/5 
                    transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                    ${getTranslateClass()}
                `}
            >
                {/* Icons cross-fading */}
                <Sun
                    className={`absolute h-4 w-4 text-orange-500 transition-all duration-500 
                    ${currentTheme === 'light' ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0'}`}
                />
                <Moon
                    className={`absolute h-4 w-4 text-blue-500 transition-all duration-500 
                    ${currentTheme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-50 rotate-90 opacity-0'}`}
                />
                <Bird
                    className={`absolute h-4 w-4 text-primary transition-all duration-500
                    ${currentTheme === 'brand' ? 'scale-100 rotate-0 opacity-100' : 'scale-50 rotate-12 opacity-0'}`}
                />
            </span>
        </button>
    )
}
