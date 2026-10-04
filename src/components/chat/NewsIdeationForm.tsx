'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Instagram as InstagramIcon,
  Linkedin as LinkedinIcon,
  Loader2,
  Minus,
  Plus,
  Check,
} from 'lucide-react';
import { Platform, IdeaContent } from '@/types';
import { cn } from '@/lib/utils';

interface NewsIdeationFormProps {
  sessionId: string;
  platforms: Platform[];
  connectedPlatforms?: Platform[];
  isLoadingPlatforms?: boolean;
  dateRange?: { start: Date; end: Date };
  onIdeasGenerated?: (ideas: IdeaContent[]) => void;
  onSessionUpdate?: (title: string) => void;
}

const PLATFORM_CONFIG: {
  id: Platform;
  name: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'INSTAGRAM',
    name: 'Instagram',
    desc: 'Carousels and posts',
    icon: <InstagramIcon className="h-5 w-5" />,
  },
  {
    id: 'LINKEDIN',
    name: 'LinkedIn',
    desc: 'Articles and image posts',
    icon: <LinkedinIcon className="h-5 w-5" />,
  },
  {
    id: 'PINTEREST',
    name: 'Pinterest',
    desc: 'Idea pins and visual cards',
    icon: <span className="font-mono font-bold text-sm">P</span>,
  },
];

const FOCUS_CHIPS = [
  { value: 'all', label: 'All tech news' },
  { value: 'ai-models', label: 'AI and ML' },
  { value: 'dev-tools', label: 'Dev tools' },
  { value: 'cloud-devops', label: 'Cloud and DevOps' },
  { value: 'startups-deals', label: 'Startups and funding' },
  { value: 'fintech', label: 'Fintech' },
];

export function NewsIdeationForm({
  sessionId,
  platforms: initialPlatforms,
  connectedPlatforms,
  isLoadingPlatforms = false,
  dateRange,
  onIdeasGenerated,
  onSessionUpdate,
}: NewsIdeationFormProps) {
  const effectiveConnected =
    connectedPlatforms !== undefined ? connectedPlatforms : initialPlatforms;

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(() => {
    if (effectiveConnected.length > 0) {
      return effectiveConnected;
    }
    return ['INSTAGRAM'];
  });

  useEffect(() => {
    if (connectedPlatforms) {
      if (connectedPlatforms.length > 0) {
        setSelectedPlatforms((prev) => {
          const valid = prev.filter((p) => connectedPlatforms.includes(p));
          return valid.length > 0 ? valid : [connectedPlatforms[0]];
        });
      } else if (!isLoadingPlatforms) {
        setSelectedPlatforms([]);
      }
    }
  }, [connectedPlatforms, isLoadingPlatforms]);

  const [focus, setFocus] = useState<string>('all');
  const [ideaCount, setIdeaCount] = useState<number>(4);
  const [customKeyword, setCustomKeyword] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const togglePlatform = (platform: Platform) => {
    const isConnected = effectiveConnected.includes(platform);
    if (!isConnected) return;

    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        return prev.filter((p) => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  const handleIncrement = () => {
    setIdeaCount((prev) => Math.min(6, prev + 1));
  };

  const handleDecrement = () => {
    setIdeaCount((prev) => Math.max(3, prev - 1));
  };

  const extractIdeasFromResponse = (content: string): IdeaContent[] => {
    if (!content) return [];
    const parsedIdeas: IdeaContent[] = [];
    const seenTitles = new Set<string>();

    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    let match;
    while ((match = jsonBlockRegex.exec(content)) !== null) {
      try {
        const potentialJson = match[1].trim();
        if (potentialJson.startsWith('[') || potentialJson.startsWith('{')) {
          const parsed = JSON.parse(potentialJson);
          const list = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of list) {
            if (item && (item.title || item.name)) {
              const title = String(item.title || item.name || 'Untitled Idea').trim();
              const normalized = title.toLowerCase();
              if (seenTitles.has(normalized)) continue;
              seenTitles.add(normalized);

              const platformUpper = (item.platform || selectedPlatforms[0] || 'INSTAGRAM').toUpperCase();
              const validPlatform: Platform = selectedPlatforms.includes(platformUpper as Platform)
                ? (platformUpper as Platform)
                : selectedPlatforms[0] || 'INSTAGRAM';

              parsedIdeas.push({
                id: item.id || `idea-${crypto.randomUUID().slice(0, 8)}`,
                title,
                description: item.description || item.concept || item.hook || '',
                platform: validPlatform,
                hook: item.hook || item.description || title,
                angle: item.angle || '',
                keyPoints: Array.isArray(item.keyPoints) ? item.keyPoints : [],
                suggestedFormat: item.suggestedFormat || (validPlatform === 'PINTEREST' ? 'pin' : 'carousel'),
                hashtags: Array.isArray(item.hashtags) ? item.hashtags : ['#tech'],
                cta: item.cta,
              });
            }
          }
        }
      } catch {
        // Continue
      }
    }

    return parsedIdeas;
  };

  const handleGenerate = async () => {
    if (selectedPlatforms.length === 0 || isGenerating) return;

    setIsGenerating(true);

    const focusChip = FOCUS_CHIPS.find((f) => f.value === focus);
    const focusLabel = focusChip ? focusChip.label : 'All Tech News';
    const messagePrompt = customKeyword.trim()
      ? `Generate ${ideaCount} tech news post ideas focusing on "${customKeyword.trim()}" for ${selectedPlatforms.join(', ')}.`
      : `Generate ${ideaCount} tech news post ideas for ${selectedPlatforms.join(', ')} covering ${focusLabel}.`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messagePrompt,
          sessionId,
          platforms: selectedPlatforms,
          dateRange,
          searchNews: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate ideas');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk || data.type === 'chunk') {
                fullContent += data.chunk || '';
              }
            } catch {
              // Ignore
            }
          }
        }
      }

      const extractedIdeas = extractIdeasFromResponse(fullContent);

      if (extractedIdeas.length > 0) {
        if (onIdeasGenerated) {
          onIdeasGenerated(extractedIdeas);
        }
        if (onSessionUpdate) {
          onSessionUpdate(`Tech Ideation: ${customKeyword || focusLabel}`);
        }
      }
    } catch (error) {
      console.error('Ideation generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedPlatformNames = selectedPlatforms
    .map((p) => PLATFORM_CONFIG.find((c) => c.id === p)?.name || p)
    .join(', ');

  const currentFocusLabel = FOCUS_CHIPS.find((f) => f.value === focus)?.label || 'All tech news';

  return (
    <div className="flex flex-col min-[1080px]:flex-row items-start gap-8 w-full pb-12">
      {/* Form on the Left (Flexible) */}
      <div className="flex-1 w-full space-y-8 min-w-0">
        {/* Section 1: Platforms */}
        <section className="space-y-3">
          <div>
            <h2 className="font-sans font-bold text-lg text-foreground">Platforms</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Pick where these ideas will be published.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {PLATFORM_CONFIG.map((platform) => {
              const isConnected = effectiveConnected.includes(platform.id);
              const isSelected = selectedPlatforms.includes(platform.id);

              if (!isConnected) {
                return (
                  <div
                    key={platform.id}
                    className="border-2 border-border bg-card p-4 flex flex-col justify-between min-h-[120px] opacity-60 cursor-not-allowed select-none"
                  >
                    <div>
                      <div className="w-[30px] h-[30px] border-2 border-border bg-muted flex items-center justify-center mb-2 text-foreground">
                        {platform.icon}
                      </div>
                      <h3 className="font-sans font-bold text-sm text-foreground">
                        {platform.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {platform.desc}
                      </p>
                    </div>
                    <Link
                      href="/settings"
                      className="font-mono text-[11px] text-muted-foreground mt-3 hover:underline"
                    >
                      Connect in Settings
                    </Link>
                  </div>
                );
              }

              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    'relative border-2 text-left p-4 flex flex-col justify-between min-h-[120px] transition-all bg-card cursor-pointer select-none',
                    isSelected
                      ? 'border-primary shadow-[5px_5px_0_0_#FF4B1F] -translate-x-[2px] -translate-y-[2px]'
                      : 'border-border hover:shadow-[3px_3px_0_0_var(--border)]'
                  )}
                >
                  {/* Selected check square */}
                  {isSelected && (
                    <div
                      className="absolute top-2 right-2 w-[22px] h-[22px] bg-primary text-primary-foreground flex items-center justify-center select-none"
                      aria-hidden="true"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    </div>
                  )}

                  <div>
                    <div className="w-[30px] h-[30px] border-2 border-border bg-background flex items-center justify-center mb-2 text-foreground">
                      {platform.icon}
                    </div>
                    <h3 className="font-sans font-bold text-sm text-foreground">
                      {platform.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {platform.desc}
                    </p>
                  </div>

                  <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-3">
                    Connected
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Industry Focus */}
        <section className="space-y-3">
          <div>
            <h2 className="font-sans font-bold text-lg text-foreground">Industry focus</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Limits which headlines the live search looks at.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {FOCUS_CHIPS.map((chip) => {
              const isSelected = focus === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setFocus(chip.value)}
                  className={cn(
                    'border-2 border-border px-3.5 py-1.5 font-mono text-[13px] font-medium transition-none select-none',
                    isSelected
                      ? 'bg-foreground text-background'
                      : 'bg-card text-foreground hover:bg-muted'
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 3: Number of ideas Stepper */}
        <section className="space-y-3">
          <div>
            <h2 className="font-sans font-bold text-lg text-foreground">Number of ideas</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Four is the best balance of variety and review time.
            </p>
          </div>

          <div className="inline-flex items-center">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={ideaCount <= 3}
              className="w-10 h-10 border-2 border-border bg-card flex items-center justify-center text-foreground hover:bg-muted active:bg-muted disabled:opacity-40 disabled:cursor-not-allowed select-none"
              aria-label="Decrease idea count"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="w-[56px] h-10 border-y-2 border-border bg-card flex items-center justify-center font-mono font-bold text-base text-foreground select-none">
              {ideaCount}
            </div>

            <button
              type="button"
              onClick={handleIncrement}
              disabled={ideaCount >= 6}
              className="w-10 h-10 border-2 border-border bg-card flex items-center justify-center text-foreground hover:bg-muted active:bg-muted disabled:opacity-40 disabled:cursor-not-allowed select-none"
              aria-label="Increase idea count"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Section 4: Topic or keyword */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="font-sans font-bold text-lg text-foreground">Topic or keyword</h2>
            <span className="font-mono text-[11px] text-muted-foreground uppercase border border-border px-1.5 py-0.5">
              Optional
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Leave blank to use the top tech headlines.
          </p>

          <input
            type="text"
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            placeholder="e.g. Claude Sonnet, Python 3.13, Nvidia earnings"
            className="w-full h-11 px-3 border-2 border-border bg-card font-sans text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent"
          />
        </section>

        {/* Voice Row */}
        <div className="border-2 border-dashed border-border p-3.5 bg-card flex items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles className="h-4 w-4 text-foreground shrink-0" aria-hidden="true" />
            <span className="font-sans text-sm text-foreground truncate">
              Voice: sarcastic, opinionated, no filter, for a coding and finance course
            </span>
          </div>

          <span className="border border-border px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-muted-foreground bg-muted shrink-0">
            Locked
          </span>
        </div>
      </div>

      {/* Right Summary Panel (Sticky, 340px) */}
      <div className="w-full min-[1080px]:w-[340px] shrink-0 min-[1080px]:sticky min-[1080px]:top-[20px]">
        <div className="border-2 border-border bg-card p-[18px] flex flex-col gap-4 shadow-[4px_4px_0_0_var(--border)]">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            This run
          </span>

          <dl className="space-y-3">
            <div>
              <dt className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Publishing to
              </dt>
              <dd className="font-sans font-bold text-sm text-foreground mt-0.5">
                {selectedPlatformNames || 'None selected'}
              </dd>
            </div>

            <div>
              <dt className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Focus
              </dt>
              <dd className="font-sans font-bold text-sm text-foreground mt-0.5">
                {currentFocusLabel}
              </dd>
            </div>

            <div>
              <dt className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Ideas
              </dt>
              <dd className="font-sans font-bold text-sm text-foreground mt-0.5">
                {ideaCount} post ideas
              </dd>
            </div>

            <div>
              <dt className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
                Keyword
              </dt>
              <dd className="font-sans font-bold text-sm text-foreground mt-0.5">
                {customKeyword.trim() ? customKeyword.trim() : 'Top headlines'}
              </dd>
            </div>
          </dl>

          <div className="border-t-2 border-border pt-4 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Each idea comes with a hook, an angle, key points and the news sources behind it.
            </p>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={selectedPlatforms.length === 0 || isGenerating}
              className={cn(
                'w-full py-3 px-4 font-sans font-bold text-sm border-2 border-border transition-transform flex items-center justify-center gap-2',
                selectedPlatforms.length > 0 && !isGenerating
                  ? 'bg-primary text-primary-foreground shadow-[4px_4px_0_0_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]'
                  : 'bg-primary text-primary-foreground opacity-40 cursor-not-allowed shadow-none'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating ideas...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate {ideaCount} ideas</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
