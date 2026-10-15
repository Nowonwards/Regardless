import React from 'react';

interface SlideCardProps {
  index: string;
  total: string;
  headline: string;
  subtext: string;
  tag: string;
  isHero?: boolean;
}

function SlideCard({ index, total, headline, subtext, tag, isHero }: SlideCardProps) {
  return (
    <div
      className={`bg-slide-bg border-2 border-ink p-5 md:p-6 flex flex-col justify-between aspect-[4/5] ${
        isHero ? 'shadow-hard-12' : 'shadow-hard-6'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="bg-slide-pill text-slide-bg font-mono text-[11px] font-bold px-2 py-0.5">
          {index} / {total}
        </span>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-1 bg-slide-accent" />
          <div className="w-3 h-1 bg-slide-accent/40" />
        </div>
      </div>

      <div className="my-auto py-4 space-y-3">
        <span className="font-mono text-[10px] text-rg-muted-dark uppercase tracking-wider block">
          {tag}
        </span>
        <h3 className="text-slide-headline font-sans font-black text-lg md:text-xl lg:text-2xl leading-[1.02] tracking-[-0.02em]">
          {headline}
        </h3>
        <p className="text-rg-muted-dark font-sans text-xs md:text-sm leading-relaxed">
          {subtext}
        </p>
      </div>

      <div className="pt-3 border-t border-rg-dashed-dark/40 flex items-center justify-between">
        <span className="text-rg-muted-dark font-mono text-[11px] uppercase tracking-wider">
          @techleader
        </span>
        <span className="text-rg-muted-dark font-mono text-[10px]">
          1080 × 1350 // NATIVE
        </span>
      </div>
    </div>
  );
}

export function SlidesSection() {
  return (
    <section
      id="slides"
      className="w-full bg-paper border-b-2 border-ink py-14 md:py-20 lg:py-[104px]"
    >
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="max-w-[720px] mb-12">
          <span className="font-mono text-xs md:text-sm font-bold text-rg-yellow uppercase tracking-[0.05em] mb-4 block">
            02 / Slides
          </span>
          <h2 className="font-sans font-black text-[38px] md:text-[56px] lg:text-[64px] leading-[0.96] tracking-[-0.03em] text-ink select-none">
            Text rendered from code. Never misspelled.
          </h2>
          <p className="font-sans text-ink/80 text-base md:text-lg lg:text-xl leading-relaxed mt-6">
            Slides are rendered at 1080×1350 from precise code templates, not synthesized by an
            image model. Headlines come out crisp, legible, and typo-free every time.
          </p>
        </div>

        {/* 3-Slide Carousel Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <SlideCard
            index="1"
            total="3"
            tag="The Hook"
            headline="Your AI pair programmer is a junior with root access."
            subtext="Code assistants write fast code, not safe code. The review burden is on you."
          />
          <SlideCard
            index="2"
            total="3"
            tag="The Reality"
            headline="Who reviews the code when volume triples?"
            subtext="Speed without architecture leads to technical debt that slows every future release."
            isHero={true}
          />
          <SlideCard
            index="3"
            total="3"
            tag="The Principle"
            headline="Read the diff. Every single time."
            subtext="Automate the boilerplate, enforce strict lints, and keep humans at the approval gate."
          />
        </div>
      </div>
    </section>
  );
}
