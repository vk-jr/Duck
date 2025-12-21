export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your brand profile and preferences.</p>
            </div>

            <div className="glass-card p-8 rounded-2xl max-w-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Brand Profile</h3>
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-muted-foreground">Brand Name</label>
                        <input type="text" defaultValue="Content Beta" className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-muted-foreground">Brand Voice</label>
                        <textarea className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white h-24" defaultValue="Professional, Authoritative, yet approachable." />
                    </div>
                    <button className="bg-primary text-black font-bold px-4 py-2 rounded-lg self-start">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )
}
