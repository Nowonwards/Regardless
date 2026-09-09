import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { RadioTower, Sparkles, Layers, Send, ShieldCheck, Activity } from 'lucide-react';
import Link from 'next/link';

const capabilities = [
  {
    step: '01',
    title: 'Intelligence Radar',
    desc: 'Live tech news ideation via RSS & Tavily AI',
    icon: Sparkles,
  },
  {
    step: '02',
    title: 'Visual Deck Studio',
    desc: 'Multi-slide HTML & SVG carousel generation',
    icon: Layers,
  },
  {
    step: '03',
    title: 'Autonomous Dispatch',
    desc: 'Zero-friction scheduling via Composio loop',
    icon: Send,
  },
];

const metrics = [
  { label: 'Platform Reach', value: '3 Networks' },
  { label: 'Autonomous Loop', value: '100% Native' },
  { label: 'Queue Latency', value: '0ms Overhead' },
];

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorPrimary: '#C6FF3D',
    colorPrimaryForeground: '#0B0B0C',
    colorBackground: '#141416',
    colorSurface: '#141416',
    colorInputBackground: '#0B0B0C',
    colorInputText: '#F2F2F0',
    colorNeutral: '#F2F2F0',
    colorText: '#F2F2F0',
    colorTextSecondary: '#8E8E93',
    borderRadius: '0px',
    fontFamily: 'var(--font-inter), sans-serif',
  },
  elements: {
    rootBox: 'w-full max-w-sm',
    cardBox: 'w-full !rounded-none !shadow-none !border-0',
    card: '!rounded-none !shadow-none !border-0 !bg-transparent p-0 sm:p-2',
    headerTitle: '!font-display text-2xl font-bold tracking-tight !text-foreground',
    headerSubtitle: '!font-mono text-xs !text-muted-foreground',
    socialButtonsBlockButton:
      '!rounded-none !border !border-border !bg-background hover:!bg-surface !text-foreground !font-mono text-xs !h-10 transition-colors',
    socialButtonsBlockButtonText: '!font-mono text-xs font-medium !text-foreground',
    dividerLine: '!bg-border',
    dividerText: '!font-mono text-[11px] !text-muted-foreground uppercase tracking-wider',
    formFieldLabel: '!font-mono text-xs font-semibold !text-foreground',
    formFieldInput:
      '!rounded-none !border !border-border !bg-background text-sm font-sans focus:!border-foreground focus:!ring-0 !h-10 !text-foreground',
    formButtonPrimary:
      '!rounded-none !bg-primary !text-primary-foreground !font-mono font-bold hover:!opacity-90 transition-opacity text-xs uppercase tracking-wider !h-10 !shadow-none',
    footer: '!bg-transparent !border-t !border-border !rounded-none mt-4 pt-4',
    footerAction: '!bg-transparent',
    footerActionText: '!font-mono text-xs !text-muted-foreground',
    footerActionLink: '!text-foreground hover:!text-primary !font-mono text-xs font-bold underline',
    footerPages: '!bg-transparent',
    footerPagesLink: '!text-muted-foreground hover:!text-foreground !font-mono text-[11px]',
    identityPreviewText: '!font-mono text-xs !text-foreground',
    identityPreviewEditButton: '!text-primary hover:underline !font-mono text-xs',
  },
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10">
      {/* Background Dot Matrix Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(hsl(var(--border-strong))_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      {/* Top Status Header */}
      <header className="w-full max-w-5xl mb-4 flex items-center justify-between font-mono text-[11px] text-muted-foreground border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-primary animate-pulse inline-block" />
          <span className="text-foreground font-medium">SYS_AUTH // REGISTRATION_GATEWAY</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>256-BIT ENCRYPTION</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span>ALL SYSTEMS OPERATIONAL</span>
          </span>
        </div>
      </header>

      {/* Main Split Terminal Frame */}
      <main className="w-full max-w-5xl border border-border bg-card shadow-2xl relative z-10">
        {/* Terminal Titlebar */}
        <div className="h-9 px-4 border-b border-border bg-muted/40 flex items-center justify-between font-mono text-[11px] text-muted-foreground select-none">
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold">●</span>
            <span className="text-foreground font-semibold uppercase tracking-wider">Account Creation Protocol</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">NEW_ACCOUNT // TLS_1.3</span>
        </div>

        {/* 2-Column Split Grid */}
        <div className="grid lg:grid-cols-12">
          {/* Left Column: Brand & Architecture Showcase */}
          <section className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-8 bg-card border-b lg:border-b-0 lg:border-r border-border">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-none border border-border bg-surface text-xs font-mono text-muted-foreground">
                <RadioTower className="h-3.5 w-3.5 text-foreground dark:text-primary" />
                <span>Autonomous Social Intelligence</span>
              </div>

              <div className="space-y-2">
                <Link href="/" className="inline-block group">
                  <span className="font-wordmark font-normal text-5xl sm:text-6xl text-foreground select-none leading-none group-hover:opacity-85 transition-opacity">
                    Regardless
                  </span>
                </Link>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Join Regardless to generate high-signal tech social content from live news feeds, orchestrate visual carousel decks, and schedule cross-platform distribution without manual busywork.
                </p>
              </div>

              {/* Capabilities Breakdown */}
              <div className="space-y-2.5 pt-2">
                {capabilities.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.step}
                      className="flex items-start justify-between border border-border bg-surface/60 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 border border-border bg-background mt-0.5">
                          <Icon className="h-3.5 w-3.5 text-foreground dark:text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-foreground dark:text-primary">
                        {item.step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Metrics Row */}
            <div className="pt-4 border-t border-border grid grid-cols-3 gap-2 text-center font-mono">
              {metrics.map((m) => (
                <div key={m.label} className="p-2 border border-border bg-surface/30">
                  <p className="text-xs font-bold text-foreground">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Right Column: Seamless Brutalist Clerk SignUp */}
          <section className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col items-center justify-center bg-surface/30">
            <SignUp appearance={clerkAppearance} />
          </section>
        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="w-full max-w-5xl mt-4 flex items-center justify-between font-mono text-[10px] text-muted-foreground/70">
        <span>© {new Date().getFullYear()} Regardless Technologies</span>
        <span className="hover:text-foreground transition-colors cursor-pointer">
          TERMS // PRIVACY // SECURITY
        </span>
      </footer>
    </div>
  );
}
