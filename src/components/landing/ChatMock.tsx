import React from 'react';
import { Check } from 'lucide-react';

interface IdeaRowProps {
  number: string;
  title: string;
  angle: string;
  checked: boolean;
  platforms: string[];
}

function IdeaRow({ number, title, angle, checked, platforms }: IdeaRowProps) {
  return (
    <div className="bg-white border-2 border-ink p-3 sm:p-4 shadow-hard-5 flex items-start gap-3 select-none">
      <div
        className={`w-5 h-5 border-2 border-ink shrink-0 mt-0.5 flex items-center justify-center ${
          checked ? 'bg-rg-orange' : 'bg-paper'
        }`}
        aria-hidden="true"
      >
        {checked && <Check size={14} strokeWidth={3} className="text-ink" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/70">
            Angle {number}
          </span>
          <div className="flex items-center gap-1.5">
            {platforms.map((p) => (
              <span
                key={p}
                className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 bg-paper border border-ink text-ink"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
        <p className="font-sans font-black text-xs sm:text-sm text-ink leading-snug">
          {title}
        </p>
        <p className="font-sans text-[11px] sm:text-xs text-ink/70 mt-1 line-clamp-1">
          {angle}
        </p>
      </div>
    </div>
  );
}

export function ChatMock() {
  return (
    <div className="w-full bg-white border-2 border-ink shadow-hard-12 select-none">
      {/* Title Bar */}
      <div className="h-12 px-4 bg-ink border-b-2 border-ink flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-rg-orange" aria-hidden="true" />
          <span className="w-2.5 h-2.5 bg-rg-yellow" aria-hidden="true" />
          <span className="w-2.5 h-2.5 bg-rg-blue" aria-hidden="true" />
          <span className="font-mono text-xs font-bold text-paper uppercase tracking-wider ml-2">
            Ideation Studio
          </span>
        </div>
        <span className="font-mono text-[10px] text-rg-muted-dark uppercase tracking-wider">
          Tavily Live Search // Online
        </span>
      </div>

      {/* Chat Body */}
      <div className="bg-paper p-4 sm:p-6 space-y-4">
        {/* User Bubble */}
        <div className="flex justify-end">
          <div className="bg-ink text-paper border-2 border-ink p-3.5 sm:p-4 max-w-[88%] font-sans text-xs sm:text-sm leading-relaxed shadow-hard-5">
            Give me 3 ideas on AI tooling for Instagram and LinkedIn.
          </div>
        </div>

        {/* Assistant Bubble */}
        <div className="flex justify-start">
          <div className="bg-white text-ink border-2 border-ink p-3.5 sm:p-4 max-w-[92%] font-sans text-xs sm:text-sm leading-relaxed shadow-hard-5">
            Here are three angles from this week&apos;s news. Select the ones you want drafted.
          </div>
        </div>

        {/* Three Idea Rows */}
        <div className="space-y-2.5 pt-2">
          <IdeaRow
            number="01"
            title="Why small models are winning on-device"
            angle="Edge inference latency dropped 60% with 3B quantization benchmarks."
            checked={true}
            platforms={['Instagram', 'LinkedIn']}
          />
          <IdeaRow
            number="02"
            title="The hidden compute cost of agents in production"
            angle="Why multi-turn tool loops blow past enterprise token budgets."
            checked={true}
            platforms={['LinkedIn']}
          />
          <IdeaRow
            number="03"
            title="Why developer tool interfaces are returning to text"
            angle="Canvas fatigue is driving developers back to raw keyboard shortcuts."
            checked={false}
            platforms={['Instagram', 'Pinterest']}
          />
        </div>
      </div>
    </div>
  );
}
