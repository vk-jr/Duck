import { login, signup } from './actions'
import { Bird } from 'lucide-react'

export default function LoginPage({
    searchParams,
}: {
    searchParams: { message: string, error: string }
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />

            <div className="w-full max-w-md space-y-8 glass-card p-8 rounded-2xl relative">
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
                        <Bird className="w-8 h-8 text-black" />
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">Content Beta</h2>
                    <p className="text-muted-foreground text-sm">
                        Premium Brand Asset Generation
                    </p>
                </div>

                <form className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="full_name">Full Name (Signup only)</label>
                        <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="email">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase text-muted-foreground" htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/50"
                            placeholder="••••••••"
                        />
                    </div>

                    {searchParams.error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-xs font-medium text-center">
                            {searchParams.error}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-4">
                        <button formAction={login} className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 rounded-xl transition-transform active:scale-95 shadow-lg shadow-primary/20">
                            Sign In
                        </button>
                        <button formAction={signup} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors border border-white/5">
                            Create Account
                        </button>
                    </div>
                </form>
            </div>
            <p className="mt-8 text-center text-xs text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    )
}
