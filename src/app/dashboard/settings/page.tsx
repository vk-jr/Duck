import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Mail, Palette } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { email, user_metadata } = user
    const fullName = user_metadata?.full_name || user_metadata?.name || 'User'

    return (
        <div className="space-y-8 font-sans max-w-5xl mx-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-serif font-bold text-foreground tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your account and brand preferences.</p>
            </div>

            <div className="flex flex-col gap-6 md:gap-8 max-w-2xl mx-auto w-full">
                {/* User Profile Section */}
                <div className="bg-card border border-border p-6 lg:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 space-y-6">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Account Details
                    </h3>

                    <div className="space-y-4">
                        <div className="group">
                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block group-focus-within:text-foreground transition-colors">Full Name</label>
                            <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground font-medium flex items-center gap-3 transition-colors hover:bg-secondary/80">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold border border-primary/10">
                                    {fullName.charAt(0).toUpperCase()}
                                </div>
                                {fullName}
                            </div>
                        </div>

                        <div className="group">
                            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email Address</label>
                            <div className="bg-muted/50 border border-border rounded-xl px-4 py-3 text-muted-foreground flex items-center gap-3 cursor-not-allowed">
                                <Mail className="w-4 h-4 opacity-70" />
                                {email}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="bg-card border border-border p-6 lg:p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 space-y-6">
                    <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" />
                        Appearance
                    </h3>
                    <div className="flex flex-col gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-foreground">Theme Preference</span>
                            <span className="text-xs text-muted-foreground leading-relaxed">Switch between Light and Dark mode using the toggle below.</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-medium text-muted-foreground">Mode</span>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
