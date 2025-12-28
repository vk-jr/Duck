export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Use the Shell from template for structure, 
    // This layout handles the inner content structure (Header + Content Padding)
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {/* Global Dashboard Header (Sticky) */}
            <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8">
                <h1 className="text-sm font-serif font-medium text-muted-foreground breadcrumbs">
                    Dashboard / <span className="text-foreground">Overview</span>
                </h1>
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-yellow-200 ring-2 ring-border" />
                </div>
            </header>

            {/* Content Area */}
            <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
                {children}
            </div>
        </div>
    )
}
