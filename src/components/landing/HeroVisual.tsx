import React from 'react';
import { Heart, MessageCircle, Send as SendIcon, Check } from 'lucide-react';

export function HeroVisual() {
  return (
    <div
      className="relative h-[540px] md:h-[600px] lg:h-[640px] w-full flex items-center justify-center lg:justify-end select-none"
      aria-hidden="true"
    >
      {/* Decorative orange accent square top-left (64px lg, 48px base/md) */}
      <div className="w-12 h-12 lg:w-16 lg:h-16 bg-rg-orange border-2 border-ink absolute top-2 sm:top-6 left-2 sm:left-6 z-0 shadow-hard-5" />

      {/* Main Instagram Carousel Mock Card */}
      <div className="w-[290px] md:w-[360px] lg:w-[380px] bg-white border-2 border-ink shadow-hard-blue relative z-10">
        {/* Card Header */}
        <div className="h-14 px-3 sm:px-4 border-b-2 border-ink flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            {/* 32px ink avatar square with orange corner block */}
            <div className="w-8 h-8 bg-ink relative border border-ink shrink-0">
              <div className="w-2.5 h-2.5 bg-rg-orange absolute bottom-0 right-0" />
            </div>
            <span className="font-mono text-xs font-bold text-ink tracking-tight">
              @yourhandle
            </span>
          </div>
          {/* Yellow Drafted tag */}
          <span className="bg-rg-yellow text-ink border-2 border-ink font-mono text-[10px] uppercase font-bold px-2 py-0.5 tracking-wider">
            Drafted
          </span>
        </div>

        {/* 4:5 Slide Area in #12141C */}
        <div className="bg-slide-bg p-4 sm:p-6 aspect-[4/5] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="bg-slide-pill text-slide-bg font-mono text-[11px] font-bold px-2 py-0.5">
              1 / 6
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-6 sm:w-8 h-1 bg-slide-accent" />
              <div className="w-3 sm:w-4 h-1 bg-slide-accent/50" />
            </div>
          </div>

          <div className="my-auto py-4">
            <h3 className="text-slide-headline font-sans font-black text-lg sm:text-xl lg:text-2xl leading-[1.05] tracking-[-0.02em]">
              Your headline lands here, rendered sharp.
            </h3>
          </div>

          <div className="pt-2 border-t border-rg-dashed-dark/40 flex items-center justify-between">
            <span className="text-rg-muted-dark font-mono text-[11px] uppercase tracking-wider">
              @yourhandle
            </span>
            <span className="text-rg-muted-dark font-mono text-[10px]">
              REGARDLESS // STUDIO
            </span>
          </div>
        </div>

        {/* Card Footer: actions & carousel dots */}
        <div className="h-12 px-3 sm:px-4 border-t-2 border-ink flex items-center justify-between bg-white">
          <div className="flex items-center gap-3 text-ink">
            <Heart size={18} strokeWidth={2} className="hover:text-rg-orange transition-colors" />
            <MessageCircle size={18} strokeWidth={2} />
            <SendIcon size={18} strokeWidth={2} />
          </div>
          {/* 4 Carousel Dots: first ink, rest #C9C4B6 */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-ink border border-ink" />
            <span className="w-2 h-2 bg-rg-placeholder border border-ink/40" />
            <span className="w-2 h-2 bg-rg-placeholder border border-ink/40" />
            <span className="w-2 h-2 bg-rg-placeholder border border-ink/40" />
          </div>
        </div>
      </div>

      {/* Overlapping Idea Card Bottom-Left */}
      <div className="w-[250px] sm:w-[290px] bg-paper border-2 border-ink shadow-hard-8 p-3 sm:p-4 absolute -bottom-3 sm:bottom-6 left-0 sm:left-4 z-20">
        <div className="flex items-center justify-between border-b-2 border-ink/20 pb-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/70">
            IDEA 02
          </span>
          {/* Orange checked checkbox */}
          <div className="w-5 h-5 bg-rg-orange border-2 border-ink flex items-center justify-center">
            <Check size={13} strokeWidth={3} className="text-ink" />
          </div>
        </div>

        <p className="font-sans font-black text-xs sm:text-sm text-ink leading-snug mt-2.5">
          The case against building another dashboard
        </p>

        <div className="mt-3 pt-2 border-t border-ink/10">
          <span className="text-rg-blue font-mono text-[10px] font-bold uppercase tracking-wider block">
            Hook
          </span>
          <div className="space-y-1 mt-1">
            <div className="h-1.5 bg-rg-placeholder border border-ink/30 w-full" />
            <div className="h-1.5 bg-rg-placeholder border border-ink/30 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
