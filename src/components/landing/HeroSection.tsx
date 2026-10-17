import React from 'react';
import Link from 'next/link';
import { HeroVisual } from './HeroVisual';

interface HeroSectionProps {
  loginHref?: string;
}

export function HeroSection({ loginHref = '/sign-in' }: HeroSectionProps) {
  return (
    <section id="top" className="w-full bg-paper border-b-2 border-ink py-14 md:py-20 lg:py-[104px]">
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start">
            {/* Platform Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6 md:mb-8">
              <span className="inline-flex items-center px-3 py-1 bg-rg-orange text-ink border-2 border-ink font-mono text-[12px] uppercase font-bold tracking-[0.05em]">
                Instagram
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-rg-yellow text-ink border-2 border-ink font-mono text-[12px] uppercase font-bold tracking-[0.05em]">
                Pinterest
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-rg-blue text-white border-2 border-ink font-mono text-[12px] uppercase font-bold tracking-[0.05em]">
                LinkedIn
              </span>
            </div>

            {/* H1 3-line headline */}
            <h1 className="font-sans font-black text-[52px] md:text-[88px] lg:text-[104px] leading-[0.94] tracking-[-0.035em] text-ink select-none">
              <span className="block">Ideas in.</span>
              <span className="block">Posts out.</span>
              <span className="inline-block mt-2 md:mt-3">
                <span className="inline-block bg-rg-yellow border-2 border-ink shadow-hard-8 -ml-[14px] px-[14px] py-1 text-ink">
                  Regardless.
                </span>
              </span>
            </h1>

            {/* Descriptive Body */}
            <p className="font-sans text-ink/90 text-lg md:text-xl lg:text-[22px] leading-relaxed max-w-[580px] mt-6 md:mt-8">
              A content studio that finds what is happening in tech, turns the ideas you pick into
              finished carousels, and publishes them to your accounts.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mt-8 md:mt-10 w-full sm:w-auto">
              <Link
                href={loginHref}
                className="inline-flex items-center justify-center bg-rg-orange text-ink border-2 border-ink font-mono text-sm md:text-base uppercase font-bold tracking-[0.05em] px-8 min-h-[48px] shadow-hard-6 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0_#111111] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all rounded-none"
              >
                Start a session
              </Link>
              <Link
                href="#ideate"
                className="inline-flex items-center justify-center bg-paper text-ink border-2 border-ink font-mono text-sm md:text-base uppercase font-bold tracking-[0.05em] px-8 min-h-[48px] hover:bg-white active:bg-paper/70 transition-colors rounded-none"
              >
                See how it works
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Visual Stack */}
          <div className="lg:col-span-5 w-full">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}
