import React from 'react';

export function TickerStrip() {
  return (
    <div
      className="w-full bg-ink border-b-2 border-ink py-4 px-4 overflow-hidden select-none"
      role="region"
      aria-label="Features summary"
    >
      <div className="max-w-[1280px] mx-auto flex items-center justify-between md:justify-center md:gap-6 lg:gap-10 font-mono text-[11px] md:text-xs lg:text-[13px] uppercase font-bold tracking-[0.05em] text-paper">
        <span className="whitespace-nowrap">Live tech news</span>
        <span className="text-rg-orange font-bold px-1" aria-hidden="true">
          /
        </span>
        <span className="whitespace-nowrap">Multi-slide drafts</span>
        <span className="text-rg-yellow font-bold px-1" aria-hidden="true">
          /
        </span>
        <span className="whitespace-nowrap">Schedule or publish now</span>
        <span className="text-rg-blue font-bold px-1" aria-hidden="true">
          /
        </span>
        {/* Full history on lg, Post history on md and base */}
        <span className="whitespace-nowrap">
          <span className="hidden lg:inline">Full history of every post</span>
          <span className="lg:hidden">Post history</span>
        </span>
      </div>
    </div>
  );
}
