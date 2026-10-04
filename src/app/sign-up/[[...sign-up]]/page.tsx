import { SignUp } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { RadioTower, Sparkles, Layers, Send, ShieldCheck, Activity } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';

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
    colorPrimary: '#FF4B1F',
    colorPrimaryForeground: '#0B0B0C',
    colorBackground: '#151517',
    colorSurface: '#151517',
    colorInputBackground: '#0B0B0C',
    colorInputText: '#F4F1EA',
    colorNeutral: '#F4F1EA',
    colorText: '#F4F1EA',
    colorTextSecondary: '#8E8E93',
    borderRadius: '0px',
    fontFamily: 'var(--font-sans), sans-serif',
  },
  elements: {
    rootBox: 'w-full max-w-sm',
    cardBox: 'w-full !rounded-none !shadow-none !border-0',
    card: '!rounded-none !shadow-none !border-0 !bg-transparent p-0 sm:p-2',
    headerTitle: '!font-sans text-2xl font-extrabold tracking-tight !text-foreground uppercase',
    headerSubtitle: '!font-mono text-xs !text-muted-foreground uppercase',
    socialButtonsBlockButton:
      '!rounded-none !border !border-border !bg-background hover:!bg-muted !text-foreground !font-mono text-xs !h-10 transition-colors',
    socialButtonsBlockButtonText: '!font-mono text-xs font-medium !text-foreground',
    dividerLine: '!bg-border !h-[2px]',
    dividerText: '!font-mono text-[11px] !text-muted-foreground uppercase tracking-wider',
    formFieldLabel: '!font-mono text-xs font-semibold !text-foreground uppercase tracking-wider',
    formFieldInput:
      '!rounded-none !border !border-border !bg-background text-sm font-sans focus:!border-accent focus:!ring-0 !h-10 !text-foreground',
    formButtonPrimary:
      '!rounded-none !bg-primary !text-primary-foreground !font-mono font-bold hover:!opacity-90 transition-opacity text-xs uppercase tracking-wider !h-10 !border !border-border !shadow-none',
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
      {/* Top Status Header */}
      <header className="w-full max-w-5xl mb-4 flex items-center justify-between font-mono text-[11px] text-muted-foreground border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-primary inline-block" />
          <span className="text-foreground font-bold tracking-wider">SYS_AUTH // REGISTRATION_GATEWAY</span>
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
      <main className="w-full max-w-5xl border border-border bg-card shadow-[4px_4px_0_0_#0B0B0C] dark:shadow-[4px_4px_0_0_#F4F1EA] relative z-10">
        {/* Terminal Titlebar */}
        <div className="h-10 px-4 border-b border-border bg-muted flex items-center justify-between font-mono text-[11px] text-muted-foreground select-none">
          <div className="flex items-center gap-2">
            <span className="text-primary font-bold">●</span>
            <span className="text-foreground font-bold uppercase tracking-wider">Account Creation Protocol</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">NEW_ACCOUNT // TLS_1.3</span>
        </div>

        {/* 2-Column Split Grid */}
        <div className="grid lg:grid-cols-12">
          {/* Left Column: Brand & Architecture Showcase */}
          <section className="lg:col-span-6 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-8 bg-card border-b lg:border-b-0 lg:border-r border-border">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-none border border-border bg-muted text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                <RadioTower className="h-3.5 w-3.5 text-primary" />
                <span>Autonomous Social Intelligence</span>
              </div>

              <div className="space-y-4">
                <Link href="/" className="inline-block group">
                  <Logo size={42} showWordmark={true} />
                </Link>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
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
                      className="flex items-start justify-between border border-border bg-card p-3 shadow-[2px_2px_0_0_#0B0B0C] dark:shadow-[2px_2px_0_0_#F4F1EA]"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 border border-border bg-muted mt-0.5">
                          <Icon className="h-3.5 w-3.5 text-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground uppercase tracking-tight">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{item.desc}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-primary">
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
                <div key={m.label} className="p-2 border border-border bg-muted">
                  <p className="text-xs font-bold text-foreground">{m.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Right Column: Seamless Brutalist Clerk SignUp */}
          <section className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col items-center justify-center bg-muted/30">
            <SignUp appearance={clerkAppearance} fallbackRedirectUrl="/overview" />
          </section>
        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="w-full max-w-5xl mt-4 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
        <span>© {new Date().getFullYear()} REGARDLESS TECHNOLOGIES</span>
        <span className="hover:text-foreground transition-colors cursor-pointer uppercase tracking-wider">
          TERMS // PRIVACY // SECURITY
        </span>
      </footer>
    </div>
  );
}

