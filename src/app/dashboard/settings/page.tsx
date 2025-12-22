import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { User, Mail } from 'lucide-react'

export default async function SettingsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    const { email, user_metadata } = user
    const fullName = user_metadata?.full_name || user_metadata?.name || 'User'

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your account and brand preferences.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                {/* User Profile Section */}
                <div className="glass-card p-8 rounded-2xl space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Account Details
                    </h3>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white font-medium flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                                    {fullName.charAt(0).toUpperCase()}
                                </div>
                                {fullName}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white/50 flex items-center gap-3 cursor-not-allowed">
                                <Mail className="w-4 h-4" />
                                {email}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Brand Profile Section (Existing) */}
                <div className="glass-card p-8 rounded-2xl space-y-6">
                    <h3 className="text-xl font-bold text-white mb-4">Brand Profile</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-muted-foreground">Brand Name</label>
                            <input type="text" defaultValue="Content Beta" className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-primary outline-none transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-muted-foreground">Brand Voice</label>
                            <textarea className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white h-32 focus:ring-1 focus:ring-primary outline-none transition-all resize-none" defaultValue="Professional, Authoritative, yet approachable." />
                        </div>
                        <button className="bg-primary text-black font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-colors self-start shadow-lg shadow-primary/10">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
