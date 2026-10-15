import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface StageProps {
  number: string;
  label: string;
  color: string;
  textColor: string;
  status: string;
}

const STAGES: StageProps[] = [
  { number: '01', label: 'Ideas', color: 'bg-white', textColor: 'text-ink', status: 'Live RSS & Tavily' },
  { number: '02', label: 'Selected', color: 'bg-paper', textColor: 'text-ink', status: 'Chosen by you' },
  { number: '03', label: 'Drafted', color: 'bg-paper', textColor: 'text-ink', status: 'Slides rendered' },
  { number: '04', label: 'In revision', color: 'bg-rg-yellow', textColor: 'text-ink', status: 'AI tweaks' },
  { number: '05', label: 'Approved', color: 'bg-rg-blue', textColor: 'text-white', status: 'Signed off' },
  { number: '06', label: 'Scheduled', color: 'bg-rg-orange', textColor: 'text-ink', status: 'On calendar' },
  { number: '07', label: 'Posted', color: 'bg-ink', textColor: 'text-paper', status: 'Live on feeds' },
];

export function PipelineSection() {
  return (
    <section
      id="pipeline"
      className="w-full bg-paper border-b-2 border-ink py-14 md:py-20 lg:py-[104px]"
    >
      <div className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-12">
        <div className="max-w-[720px] mb-12">
          <span className="font-mono text-xs md:text-sm font-bold text-ink uppercase tracking-[0.05em] mb-4 block">
            04 / Pipeline
          </span>
          <h2 className="font-sans font-black text-[38px] md:text-[56px] lg:text-[64px] leading-[0.96] tracking-[-0.03em] text-ink select-none">
            Seven clear stages. Total visibility.
          </h2>
          <p className="font-sans text-ink/80 text-base md:text-lg lg:text-xl leading-relaxed mt-6">
            Every post moves through a deterministic kanban flow. You always know what is in drafting,
            what is waiting on your decision, and what is queued for distribution.
          </p>
        </div>

        {/* Pipeline Stage Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 select-none">
          {STAGES.map((stage) => (
            <div
              key={stage.number}
              className={`${stage.color} ${stage.textColor} border-2 border-ink p-4 flex flex-col justify-between min-h-[140px] shadow-hard-5`}
            >
              <div className="flex items-center justify-between border-b border-current/20 pb-2">
                <span className="font-mono text-xs font-bold">{stage.number}</span>
                <CheckCircle2 size={14} strokeWidth={2} />
              </div>
              <div className="my-auto py-2">
                <p className="font-sans font-black text-sm md:text-base leading-tight">
                  {stage.label}
                </p>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
                {stage.status}
              </span>
            </div>
          ))}
        </div>

        {/* Flow Description Banner */}
        <div className="mt-8 p-5 bg-white border-2 border-ink shadow-hard-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-rg-orange border border-ink" />
            <p className="font-sans text-sm md:text-base text-ink font-bold">
              Autonomous generation with strict human-in-the-loop review.
            </p>
          </div>
          <div className="flex items-center gap-2 text-ink font-mono text-xs uppercase font-bold tracking-wider">
            <span>Idea to feed</span>
            <ArrowRight size={16} strokeWidth={2} className="text-rg-orange" />
          </div>
        </div>
      </div>
    </section>
  );
}
