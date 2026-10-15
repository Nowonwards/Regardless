import React from 'react';
import { ChatMock } from './ChatMock';

export function IdeateSection() {
  return (
    <section
      id="ideate"
      className="w-full bg-paper border-b-2 border-ink py-14 md:py-20 lg:py-[104px]"
    >
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center">
          {/* Left Column: Copy & Value Proposition */}
          <div className="lg:col-span-6 flex flex-col items-start">
            <span className="font-mono text-xs md:text-sm font-bold text-rg-orange uppercase tracking-[0.05em] mb-4">
              01 / Ideate
            </span>

            <h2 className="font-sans font-black text-[38px] md:text-[56px] lg:text-[64px] leading-[0.96] tracking-[-0.03em] text-ink select-none">
              Start with a chat, not a blank page.
            </h2>

            <p className="font-sans text-ink/80 text-base md:text-lg lg:text-xl leading-relaxed mt-6 max-w-[540px]">
              The Ideation Studio searches live tech news and proposes angles you can post this
              week.
            </p>

            {/* Three bullet rows with 14px colored squares */}
            <div className="space-y-4 mt-8 w-full max-w-[540px]">
              <div className="flex items-start gap-3.5">
                <div
                  className="w-3.5 h-3.5 bg-rg-orange border-2 border-ink shrink-0 mt-1"
                  aria-hidden="true"
                />
                <p className="font-sans text-sm md:text-base text-ink leading-snug">
                  <strong className="font-black text-ink">Pick your platforms.</strong>{' '}
                  <span className="text-ink/80">Instagram, Pinterest, LinkedIn, or all three.</span>
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <div
                  className="w-3.5 h-3.5 bg-rg-yellow border-2 border-ink shrink-0 mt-1"
                  aria-hidden="true"
                />
                <p className="font-sans text-sm md:text-base text-ink leading-snug">
                  <strong className="font-black text-ink">Choose a focus.</strong>{' '}
                  <span className="text-ink/80">An industry, or your own keyword.</span>
                </p>
              </div>

              <div className="flex items-start gap-3.5">
                <div
                  className="w-3.5 h-3.5 bg-rg-blue border-2 border-ink shrink-0 mt-1"
                  aria-hidden="true"
                />
                <p className="font-sans text-sm md:text-base text-ink leading-snug">
                  <strong className="font-black text-ink">Set the count.</strong>{' '}
                  <span className="text-ink/80">Anywhere from 3 to 6 ideas per round.</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Chat Mockup */}
          <div className="lg:col-span-6 w-full">
            <ChatMock />
          </div>
        </div>
      </div>
    </section>
  );
}
