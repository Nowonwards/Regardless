import React from 'react';
import Link from 'next/link';
import { LandingLogo } from './LandingLogo';

interface LandingFooterProps {
  loginHref?: string;
}

export function LandingFooter({ loginHref = '/sign-in' }: LandingFooterProps) {
  return (
    <>
      {/* Final CTA Band */}
      <section className="w-full bg-rg-yellow border-b-2 border-ink py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-[620px]">
            <h2 className="font-sans font-black text-[38px] md:text-[52px] lg:text-[60px] leading-[0.96] tracking-[-0.03em] text-ink select-none">
              Stop staring at a blank caption box.
            </h2>
            <p className="font-sans text-ink/90 text-lg md:text-xl leading-relaxed mt-4">
              Open Regardless, ask for ideas from live tech news, and have a reviewed carousel deck
              ready to publish in minutes.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Link
              href={loginHref}
              className="inline-flex items-center justify-center w-full md:w-auto bg-ink text-paper border-2 border-ink font-mono text-sm md:text-base uppercase font-bold tracking-[0.05em] px-8 min-h-[52px] shadow-hard-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#111111] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all rounded-none"
            >
              Open Regardless
            </Link>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <footer className="w-full bg-paper py-8 md:py-12 select-none">
        <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <LandingLogo href="#top" />

          <div className="flex items-center gap-6 md:gap-8 font-mono text-xs uppercase tracking-wider text-ink/80">
            <Link
              href="https://github.com/Nowonwards/Regardless"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rg-orange transition-colors min-h-[44px] inline-flex items-center"
            >
              GitHub
            </Link>
            <span className="text-ink/40">/</span>
            <Link
              href={loginHref}
              className="hover:text-rg-orange transition-colors min-h-[44px] inline-flex items-center"
            >
              Studio
            </Link>
            <span className="text-ink/40">/</span>
            <span className="text-ink/60 min-h-[44px] inline-flex items-center">
              © 2026 Regardless
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
