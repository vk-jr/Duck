export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Use the Shell from template for structure, 
    // This layout handles the inner content structure (Header + Content Padding)
    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">


            {/* Content Area */}
            <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
                {children}
            </div>
        </div>
    )
}
