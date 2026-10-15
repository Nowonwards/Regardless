import React from 'react';
import { Calendar, Shield, Sliders, Layers, Sparkles, Share2 } from 'lucide-react';

interface BentoCardProps {
  tag: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bg?: string;
  colSpan?: string;
}

function BentoCard({
  tag,
  title,
  description,
  icon,
  bg = 'bg-white',
  colSpan = 'col-span-1',
}: BentoCardProps) {
  return (
    <article
      className={`${bg} ${colSpan} border-2 border-ink p-6 md:p-8 shadow-hard-6 flex flex-col justify-between select-none`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.05em] px-2.5 py-0.5 bg-paper border border-ink text-ink">
            {tag}
          </span>
          <div className="text-ink" aria-hidden="true">
            {icon}
          </div>
        </div>
        <h3 className="font-sans font-black text-xl md:text-2xl text-ink leading-tight tracking-[-0.02em]">
          {title}
        </h3>
        <p className="font-sans text-sm md:text-base text-ink/80 leading-relaxed mt-3">
          {description}
        </p>
      </div>
    </article>
  );
}

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="w-full bg-paper border-b-2 border-ink py-14 md:py-20 lg:py-[104px]"
    >
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="max-w-[720px] mb-12">
          <span className="font-mono text-xs md:text-sm font-bold text-rg-blue uppercase tracking-[0.05em] mb-4 block">
            03 / Features
          </span>
          <h2 className="font-sans font-black text-[38px] md:text-[56px] lg:text-[64px] leading-[0.96] tracking-[-0.03em] text-ink select-none">
            Everything between the idea and the post.
          </h2>
          <p className="font-sans text-ink/80 text-base md:text-lg lg:text-xl leading-relaxed mt-6">
            One unified workstation for ideation, slide rendering, quality review, and multi-network
            dispatch so nothing gets lost across tabs.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <BentoCard
            tag="News Intelligence"
            title="News-backed ideas, not generic filler."
            description="Live search checks current headlines with Tavily before generating angles. Pick between 3 and 6 structured concepts per run."
            icon={<Sparkles size={20} strokeWidth={2} />}
            bg="bg-rg-yellow/20"
          />
          <BentoCard
            tag="Template Engine"
            title="Code-native slides, zero rendering artifacts."
            description="Headlines are rendered from SVG/HTML layouts into 1080×1350 PNG decks without fuzzy diffusion artifacts or AI hallucinations."
            icon={<Layers size={20} strokeWidth={2} />}
          />
          <BentoCard
            tag="Safety Gate"
            title="Human review before anything touches public feeds."
            description="Every draft stays locked in a review queue until you approve. Request revisions in natural language or edit copy in real time."
            icon={<Shield size={20} strokeWidth={2} />}
          />
          <BentoCard
            tag="Visual Schedule"
            title="Editorial calendar for the entire month."
            description="Day, 4-day, week, and month views give immediate visibility on scheduled releases. Click any empty slot to target ideas at it."
            icon={<Calendar size={20} strokeWidth={2} />}
          />
          <BentoCard
            tag="Manual Studio"
            title="Skip AI whenever you want total manual control."
            description="Upload custom graphic assets, write slide headlines and captions, reorder slides, and schedule directly into the queue."
            icon={<Sliders size={20} strokeWidth={2} />}
          />
          <BentoCard
            tag="OAuth Pipeline"
            title="Connect your accounts with native OAuth."
            description="Link Instagram Business or Creator accounts, LinkedIn personal or company pages, and Pinterest boards per workspace."
            icon={<Share2 size={20} strokeWidth={2} />}
          />
        </div>
      </div>
    </section>
  );
}
