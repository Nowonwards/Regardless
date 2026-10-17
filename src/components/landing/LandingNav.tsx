import React from 'react';
import Link from 'next/link';
import { LandingLogo } from './LandingLogo';

interface LandingNavProps {
  loginHref?: string;
}

export function LandingNav({ loginHref = '/sign-in' }: LandingNavProps) {
  return (
    <nav className="w-full bg-paper border-b-2 border-ink sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12 h-20 flex items-center justify-between">
        {/* Left: Logo Mark & Wordmark */}
        <LandingLogo href="#top" />

        {/* Center: Navigation Links (hidden on mobile, selective on tablet/desktop) */}
        <div className="hidden md:flex items-center gap-8 lg:gap-10">
          <Link
            href="#ideate"
            className="font-mono text-[12px] uppercase font-bold tracking-[0.05em] text-ink hover:text-rg-orange transition-colors min-h-[44px] inline-flex items-center"
          >
            Ideate
          </Link>
          <Link
            href="#slides"
            className="hidden lg:inline-flex font-mono text-[12px] uppercase font-bold tracking-[0.05em] text-ink hover:text-rg-orange transition-colors min-h-[44px] items-center"
          >
            Slides
          </Link>
          <Link
            href="#features"
            className="font-mono text-[12px] uppercase font-bold tracking-[0.05em] text-ink hover:text-rg-orange transition-colors min-h-[44px] inline-flex items-center"
          >
            Features
          </Link>
          <Link
            href="#pipeline"
            className="hidden lg:inline-flex font-mono text-[12px] uppercase font-bold tracking-[0.05em] text-ink hover:text-rg-orange transition-colors min-h-[44px] items-center"
          >
            Pipeline
          </Link>
        </div>

        {/* Right: CTA Button */}
        <div className="flex items-center">
          {/* Desktop & Tablet: Open the studio */}
          <Link
            href={loginHref}
            className="hidden md:inline-flex items-center justify-center bg-ink text-paper border-2 border-ink font-mono text-[13px] uppercase font-bold tracking-[0.05em] px-6 min-h-[44px] shadow-hard-5 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_#111111] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all rounded-none"
          >
            Open the studio
          </Link>

          {/* Mobile: Open */}
          <Link
            href={loginHref}
            className="md:hidden inline-flex items-center justify-center bg-ink text-paper border-2 border-ink font-mono text-[12px] uppercase font-bold tracking-[0.05em] px-4 min-h-[44px] shadow-hard-5 hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all rounded-none"
          >
            Open
          </Link>
        </div>
      </div>
    </nav>
  );
}
