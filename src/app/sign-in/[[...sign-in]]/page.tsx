import { SignIn } from '@clerk/nextjs';
import { RadioTower, Sparkles, Layers, Send } from 'lucide-react';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-background">
      <div className="w-full max-w-5xl grid gap-8 lg:grid-cols-12 items-center">
        {/* Brand Showcase Left Column */}
        <section className="lg:col-span-6 space-y-6 lg:pr-6">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-none border border-border bg-card text-xs font-mono text-muted-foreground">
            <RadioTower className="h-3.5 w-3.5 text-foreground dark:text-primary" />
            <span>Autonomous Intelligence Loop</span>
          </div>

          <div className="space-y-2">
            <Link href="/" className="inline-block group">
              <span className="font-wordmark font-normal text-5xl sm:text-6xl text-foreground select-none leading-none group-hover:opacity-85 transition-opacity">
                Regardless
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Generate high-signal tech social content from live news feeds, orchestrate visual carousel decks, and schedule cross-platform distribution without the busywork.
            </p>
          </div>

          <div className="pt-2 space-y-2 text-xs text-muted-foreground font-mono">
            {[
              { title: 'Idea Discovery', desc: 'Real-time tech news ideation', icon: Sparkles },
              { title: 'Slide Generation', desc: 'Multi-slide carousels & visuals', icon: Layers },
              { title: 'Autonomous Queue', desc: 'Instagram, LinkedIn, Pinterest', icon: Send },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-foreground dark:text-primary" />
                    <span className="font-medium text-foreground">{item.title}</span>
                    <span className="text-[11px] text-muted-foreground/80 hidden sm:inline">— {item.desc}</span>
                  </div>
                  <span className="text-foreground dark:text-primary font-bold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Clerk SignIn Right Column */}
        <section className="lg:col-span-6 flex justify-center">
          <SignIn
            appearance={{
              elements: {
                rootBox: 'w-full max-w-md',
                card: 'bg-surface border border-border rounded-none shadow-none p-6 sm:p-8',
                headerTitle: 'font-display text-2xl font-bold tracking-tight text-foreground',
                headerSubtitle: 'font-mono text-xs text-muted-foreground',
                socialButtonsBlockButton:
                  'rounded-none border border-border bg-background hover:bg-surface text-foreground font-mono text-xs h-10 transition-colors',
                socialButtonsBlockButtonText: 'font-mono text-xs font-medium text-foreground',
                dividerLine: 'bg-border',
                dividerText: 'font-mono text-[11px] text-muted-foreground uppercase tracking-wider',
                formFieldLabel: 'font-mono text-xs font-semibold text-foreground',
                formFieldInput:
                  'rounded-none border border-border bg-background text-sm font-sans focus:border-foreground focus:ring-0 h-10 text-foreground',
                formButtonPrimary:
                  'rounded-none bg-primary text-primary-foreground font-mono font-bold hover:opacity-90 transition-opacity text-xs uppercase tracking-wider h-10 shadow-none',
                footerActionLink: 'text-foreground font-semibold hover:underline font-mono text-xs',
                identityPreviewText: 'font-mono text-xs text-foreground',
                identityPreviewEditButton: 'text-foreground hover:underline font-mono text-xs',
              },
            }}
          />
        </section>
      </div>
    </div>
  );
}
