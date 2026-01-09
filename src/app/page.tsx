import Link from 'next/link'
import { ArrowRight, Sparkles, Zap, ShieldCheck, Bird } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Bird className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight">Content Beta</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border text-sm md:text-base animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">The Future of Brand Assets</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black tracking-tighter leading-[1.1] md:leading-[1.1]">
            Create Premium <br />
            <span className="opacity-90">
              Brand Assets
            </span>
            <span className="block text-muted-foreground">Instantly.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed font-sans">
            Generate consistent, on-brand marketing materials using our advanced AI.
            Stop wasting time on generic stock photos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 hover:scale-105 transition-all flex items-center justify-center gap-2 group shadow-lg shadow-primary/20"
            >
              Start Creating Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-card text-foreground rounded-2xl font-bold text-lg hover:bg-secondary transition-all border border-border"
            >
              View Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-secondary/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Generate pro-quality visuals in seconds, not hours. Streamline your workflow."
              },
              {
                icon: ShieldCheck,
                title: "Brand Safe",
                desc: "Our AI is trained to strictly adhere to your brand guidelines, ensuring consistency."
              },
              {
                icon: Sparkles,
                title: "Premium Quality",
                desc: "High-resolution output ready for any campaign, from social media to billboards."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-3xl bg-card border border-border hover:border-primary/20 transition-colors shadow-sm">
                <div className="w-12 h-12 bg-secondary rounded-2xl flex items-center justify-center border border-border mb-6">
                  <feature.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-xl font-serif font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-sans">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Bird className="w-5 h-5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">© 2024 Content Beta</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
