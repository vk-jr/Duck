import Link from 'next/link'
import { ArrowRight, Sparkles, Zap, ShieldCheck, Bird } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/10">
              <Bird className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight">Content Beta</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50 text-sm md:text-base backdrop-blur-sm animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span className="text-muted-foreground font-medium">The Future of Brand Assets</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-black tracking-tight leading-[1.1] md:leading-[1.05] animate-fade-in-up delay-100">
            Create Premium <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Brand Assets
            </span>
            <span className="block text-muted-foreground/80 mt-2">Instantly.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed font-sans animate-fade-in-up delay-200">
            Generate consistent, on-brand marketing materials using our advanced AI.
            Stop wasting time on generic stock photos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in-up delay-300">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-xl shadow-primary/20"
            >
              Start Creating Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-background text-foreground rounded-2xl font-bold text-lg hover:bg-secondary/50 transition-all border border-border shadow-sm hover:shadow-md"
            >
              View Features
            </Link>
          </div>

          {/* Abstract Dashboard Mockup */}
          <div className="mt-16 relative mx-auto max-w-4xl group animate-float animation-delay-500">
            <div
              className="relative"
              style={{ transform: 'perspective(1000px) rotateX(12deg)' }}
            >
              <div className="absolute inset-0 bg-primary/10 blur-3xl -z-10 rounded-[3rem] transform translate-y-12 opacity-50 transition-opacity group-hover:opacity-75" />
              <div className="bg-card border border-border/60 rounded-xl md:rounded-[2rem] shadow-2xl p-2 md:p-4 overflow-hidden relative">
                <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                {/* Mock UI Header */}
                <div className="flex items-center gap-4 px-4 py-3 border-b border-border/40">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <div className="h-6 w-32 bg-secondary rounded-full flex mx-auto opacity-50" />
                </div>

                {/* Mock UI Body */}
                <div className="p-4 md:p-8 grid grid-cols-12 gap-6 bg-secondary/10">
                  {/* Sidebar */}
                  <div className="hidden md:block col-span-3 space-y-3">
                    <div className="h-10 w-full bg-primary/5 rounded-lg border border-primary/5" />
                    <div className="h-8 w-3/4 bg-secondary rounded-lg opacity-60" />
                    <div className="h-8 w-5/6 bg-secondary rounded-lg opacity-60" />
                    <div className="h-8 w-4/5 bg-secondary rounded-lg opacity-60" />
                  </div>
                  {/* Main Content */}
                  <div className="col-span-12 md:col-span-9 grid gap-6">
                    <div className="h-32 w-full bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/10 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary/40 animate-pulse" />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-[4/3] bg-card rounded-lg border border-border shadow-sm" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 md:py-32 bg-background relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-serif font-bold mb-6">Designed for Modern Brands</h2>
            <p className="text-lg text-muted-foreground">Everything you need to maintain brand consistency and scale your asset creation.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast Generation",
                desc: "Create professional marketing assets in seconds. Our optimized AI engine delivers high-fidelity results instantly."
              },
              {
                icon: ShieldCheck,
                title: "Strict Brand Guardrails",
                desc: "Never worry about going off-brand. Our system ingests your guidelines and ensures every pixel complies."
              },
              {
                icon: Sparkles,
                title: "Premium Quality Output",
                desc: "Export in 4K resolution, ready for print or digital campaigns. No artifacts, just crisp visuals."
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-3xl bg-card border border-border hover:border-primary/20 transition-all hover:shadow-xl hover:-translate-y-1 group">
                <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-serif font-bold mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-sans">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-secondary/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent z-0" />

            {[
              { step: 1, title: 'Upload Brand Assets', desc: 'Securely upload your logos, fonts, and brand colors.' },
              { step: 2, title: 'Describe Your Need', desc: 'Tell our AI what you want to create with a simple prompt.' },
              { step: 3, title: 'Download & Publish', desc: 'Get instant results, tweak if needed, and ship it.' }
            ].map((item, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 bg-background rounded-full border-4 border-secondary flex items-center justify-center mb-6 shadow-sm group-hover:border-primary/20 transition-colors">
                  <span className="text-3xl font-bold text-primary/50 font-serif">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-primary rounded-[2.5rem] p-12 md:p-24 text-center relative overflow-hidden text-primary-foreground shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_20%,rgba(255,255,255,0.05)_20%,rgba(255,255,255,0.05)_22%,transparent_22%,transparent_40%,rgba(255,255,255,0.05)_40%,rgba(255,255,255,0.05)_42%,transparent_42%)] opacity-30 pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-6xl font-serif font-black tracking-tight text-white mb-6">
              Ready to Transform <br /> Your Brand Presence?
            </h2>
            <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto font-light">
              Join thousands of marketers creating premium assets at scale. No credit card required to start.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link
                href="/dashboard"
                className="bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Get Started for Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Bird className="w-5 h-5 text-primary" />
            <span className="text-muted-foreground font-medium">© 2024 Content Beta. All rights reserved.</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
