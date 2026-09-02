'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Camera,
  Pin,
  Briefcase,
  Loader2,
  CheckCircle2,
  Check,
  Globe,
  Sliders,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Platform, IdeaContent } from '@/types';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  sessionId: string;
  platforms: Platform[];
  connectedPlatforms?: Platform[];
  isLoadingPlatforms?: boolean;
  dateRange?: { start: Date; end: Date };
  onIdeasGenerated: (ideas: IdeaContent[]) => void;
  onSessionUpdate: (title: string) => void;
}

const PLATFORM_OPTIONS: { id: Platform; label: string; icon: React.ReactNode; color: string; border: string; bg: string }[] = [
  {
    id: 'INSTAGRAM',
    label: 'Instagram',
    icon: <Camera className="h-4 w-4" />,
    color: 'text-[hsl(var(--instagram))]',
    border: 'border-[hsl(var(--instagram))]/30',
    bg: 'bg-[hsl(var(--instagram-light))]',
  },
  {
    id: 'LINKEDIN',
    label: 'LinkedIn',
    icon: <Briefcase className="h-4 w-4" />,
    color: 'text-[hsl(var(--linkedin))]',
    border: 'border-[hsl(var(--linkedin))]/30',
    bg: 'bg-[hsl(var(--linkedin-light))]',
  },
  {
    id: 'PINTEREST',
    label: 'Pinterest',
    icon: <Pin className="h-4 w-4" />,
    color: 'text-[hsl(var(--pinterest))]',
    border: 'border-[hsl(var(--pinterest))]/30',
    bg: 'bg-[hsl(var(--pinterest-light))]',
  },
];

const TOPIC_PRESETS = [
  { value: 'all', label: '🌐 All Tech Industry News (Product Launches, AI, Deals, Shifts)' },
  { value: 'ai-models', label: '🤖 AI & LLM Model Releases (Claude, OpenAI, DeepSeek, Gemini, Meta)' },
  { value: 'dev-tools', label: '🛠️ Developer Tools, Open Source & Frameworks (Next.js, Python, Rust)' },
  { value: 'startups-deals', label: '💰 Tech Startups, Funding Rounds, Layoffs & VC Moves' },
  { value: 'big-tech', label: '🏢 Big Tech Drama (Apple, Microsoft, Google, Nvidia, Meta)' },
];

export function ChatInterface({
  sessionId,
  platforms: initialPlatforms,
  connectedPlatforms,
  isLoadingPlatforms = false,
  dateRange,
  onIdeasGenerated,
  onSessionUpdate,
}: ChatInterfaceProps) {
  const effectiveConnected = connectedPlatforms !== undefined
    ? connectedPlatforms
    : initialPlatforms;

  const visiblePlatforms = PLATFORM_OPTIONS.filter((plat) => effectiveConnected.includes(plat.id));

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

  const [newsFocus, setNewsFocus] = useState<string>('all');
  const [customKeyword, setCustomKeyword] = useState<string>('');
  const [ideaCount, setIdeaCount] = useState<string>('4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  const togglePlatform = (platform: Platform) => {
    const isConnected = effectiveConnected.includes(platform);
    if (!isConnected) return;

    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        if (prev.length === 1) return prev; // Keep at least one platform selected
        return prev.filter((p) => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  const extractIdeasFromResponse = (content: string): IdeaContent[] => {
    if (!content) return [];
    const parsedIdeas: IdeaContent[] = [];

    // 1. Try finding JSON code block (```json [...] ``` or ``` [...])
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
              const platformUpper = (item.platform || selectedPlatforms[0] || 'INSTAGRAM').toUpperCase();
              const validPlatform: Platform = selectedPlatforms.includes(platformUpper as Platform)
                ? (platformUpper as Platform)
                : (selectedPlatforms[0] || 'INSTAGRAM');

              parsedIdeas.push({
                id: item.id || `idea-${crypto.randomUUID().slice(0, 8)}`,
                title: item.title || item.name || 'Untitled Idea',
                description: item.description || item.concept || item.content?.hook || item.hook || '',
                platform: validPlatform,
                hook: item.hook || item.content?.hook || item.description || '',
                angle: item.angle || item.content?.angle || '',
                keyPoints: Array.isArray(item.keyPoints)
                  ? item.keyPoints
                  : Array.isArray(item.content?.keyPoints)
                  ? item.content.keyPoints
                  : [],
                suggestedFormat: item.suggestedFormat || item.content?.suggestedFormat || (validPlatform === 'PINTEREST' ? 'pin' : 'carousel'),
                hashtags: Array.isArray(item.hashtags)
                  ? item.hashtags
                  : Array.isArray(item.content?.hashtags)
                  ? item.content.hashtags
                  : ['#tech', '#programming'],
                cta: item.cta || item.content?.cta,
              });
            }
          }
        }
      } catch {
        // Fallback continues
      }
    }

    if (parsedIdeas.length > 0) return parsedIdeas;

    // 2. Try parsing raw JSON array in text
    const rawArrayMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (rawArrayMatch) {
      try {
        const parsed = JSON.parse(rawArrayMatch[0]);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.title) {
              const platformUpper = (item.platform || selectedPlatforms[0] || 'INSTAGRAM').toUpperCase();
              const validPlatform: Platform = ['INSTAGRAM', 'PINTEREST', 'LINKEDIN'].includes(platformUpper)
                ? (platformUpper as Platform)
                : 'INSTAGRAM';

              parsedIdeas.push({
                id: item.id || `idea-${crypto.randomUUID().slice(0, 8)}`,
                title: item.title,
                description: item.description || item.hook || '',
                platform: validPlatform,
                hook: item.hook || item.content?.hook || item.description || '',
                angle: item.angle || item.content?.angle || '',
                keyPoints: Array.isArray(item.keyPoints) ? item.keyPoints : [],
                suggestedFormat: item.suggestedFormat || 'carousel',
                hashtags: Array.isArray(item.hashtags) ? item.hashtags : ['#tech'],
                cta: item.cta,
              });
            }
          }
        }
      } catch {
        // Fallback
      }
    }

    if (parsedIdeas.length > 0) return parsedIdeas;

    // 3. Fallback: Parse markdown numbered list items
    const markdownLines = content.split('\n');
    let currentIdea: Partial<IdeaContent> | null = null;

    for (const line of markdownLines) {
      const titleMatch = line.match(/(?:###|\*\*|\d+\.)\s*(?:Idea\s*\d*[:.-]?\s*)?([^\n*#]+)/i);
      if (titleMatch && (line.toLowerCase().includes('idea') || /^\s*\d+\./.test(line))) {
        if (currentIdea && currentIdea.title) {
          parsedIdeas.push({
            id: `idea-${crypto.randomUUID().slice(0, 8)}`,
            title: currentIdea.title,
            description: currentIdea.description || currentIdea.hook || '',
            platform: currentIdea.platform || selectedPlatforms[0] || 'INSTAGRAM',
            hook: currentIdea.hook || currentIdea.title,
            angle: currentIdea.angle || '',
            keyPoints: currentIdea.keyPoints || [],
            suggestedFormat: currentIdea.suggestedFormat || 'carousel',
            hashtags: currentIdea.hashtags || ['#tech'],
            cta: currentIdea.cta,
          });
        }
        currentIdea = {
          title: titleMatch[1].trim(),
          platform: selectedPlatforms[0] || 'INSTAGRAM',
          keyPoints: [],
        };
      } else if (currentIdea) {
        if (line.toLowerCase().includes('hook:')) {
          currentIdea.hook = line.split(/hook:/i)[1]?.trim() || '';
        } else if (line.toLowerCase().includes('angle:')) {
          currentIdea.angle = line.split(/angle:/i)[1]?.trim() || '';
        } else if (line.toLowerCase().includes('description:')) {
          currentIdea.description = line.split(/description:/i)[1]?.trim() || '';
        }
      }
    }
    if (currentIdea && currentIdea.title) {
      parsedIdeas.push({
        id: `idea-${crypto.randomUUID().slice(0, 8)}`,
        title: currentIdea.title,
        description: currentIdea.description || currentIdea.hook || '',
        platform: currentIdea.platform || selectedPlatforms[0] || 'INSTAGRAM',
        hook: currentIdea.hook || currentIdea.title,
        angle: currentIdea.angle || '',
        keyPoints: currentIdea.keyPoints || [],
        suggestedFormat: currentIdea.suggestedFormat || 'carousel',
        hashtags: currentIdea.hashtags || ['#tech'],
        cta: currentIdea.cta,
      });
    }

    return parsedIdeas;
  };

  const handleGenerate = async () => {
    if (selectedPlatforms.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setGenerationStep('🔍 Searching latest verified tech industry news with Tavily...');

    const topicLabel = TOPIC_PRESETS.find((t) => t.value === newsFocus)?.label || 'All Tech News';
    const messagePrompt = customKeyword.trim()
      ? `Generate ${ideaCount} tech news post ideas focusing on "${customKeyword.trim()}" for ${selectedPlatforms.join(', ')}.`
      : `Generate ${ideaCount} tech news post ideas for ${selectedPlatforms.join(', ')} covering ${topicLabel}.`;

    try {
      setTimeout(() => {
        setGenerationStep('💡 Formulating sarcastic hooks & high-converting angles...');
      }, 2500);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messagePrompt,
          sessionId,
          platforms: selectedPlatforms,
          dateRange,
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
              if (data.chunk) {
                fullContent += data.chunk;
              } else if (data.done) {
                break;
              }
            } catch {
              // Ignore
            }
          }
        }
      }

      const extractedIdeas = extractIdeasFromResponse(fullContent);
      setLastSummary(fullContent.replace(/```(?:json)?\s*\[[\s\S]*?\]\s*```/g, '').trim());

      if (extractedIdeas.length > 0) {
        onIdeasGenerated(extractedIdeas);
        onSessionUpdate(`Tech Ideation: ${customKeyword || topicLabel.slice(0, 30)}`);
      }
    } catch (error) {
      console.error('Ideation generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="h-full overflow-auto p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      {/* Studio Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-none border border-border bg-surface text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Tech News Ideation Studio</h2>
            <p className="text-sm text-muted-foreground">
              Select your target platforms and tech focus to generate data-backed post ideas.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Card */}
      <Card className="rounded-none border border-border bg-card" elevation="none">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-base font-bold flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            Ideation Parameters
          </CardTitle>
          <CardDescription className="text-xs font-mono">
            Choose the platforms and news topics you want to cover this week.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Platform Selector Boxes */}
          <div className="space-y-2.5">
            <Label className="text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between">
              <span>Target Platforms (Click to toggle)</span>
              <span className="text-xs font-mono text-muted-foreground font-normal">
                {selectedPlatforms.length} platform(s) selected
              </span>
            </Label>

            {effectiveConnected.length === 0 && !isLoadingPlatforms && (
              <div className="rounded-none border border-amber-500 bg-surface p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-amber-500">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>No social accounts connected yet. Connect your accounts in Settings to generate and publish posts.</span>
                </div>
                <Link href="/settings">
                  <Button size="sm" variant="outline" className="h-7 text-xs font-mono rounded-none shrink-0 border-amber-500 hover:bg-surface gap-1">
                    Connect in Settings
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Platform Selector Grid - ONLY show connected platforms */}
            {visiblePlatforms.length > 0 ? (
              <div className={cn(
                'grid gap-3',
                visiblePlatforms.length === 1 ? 'grid-cols-1 max-w-sm' : visiblePlatforms.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-xl' : 'grid-cols-1 sm:grid-cols-3'
              )}>
                {visiblePlatforms.map((plat) => {
                  const isSelected = selectedPlatforms.includes(plat.id);

                  return (
                    <div
                      key={plat.id}
                      onClick={() => togglePlatform(plat.id)}
                      className={cn(
                        'p-3.5 rounded-none border text-left transition-all relative overflow-hidden flex flex-col justify-between h-28 cursor-pointer',
                        isSelected
                          ? 'bg-surface border-primary ring-1 ring-primary'
                          : 'bg-card border-border hover:border-primary/60'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className={cn('p-1.5 rounded-none border border-border bg-background', plat.color)}>
                          {plat.icon}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-emerald-400 bg-surface px-1.5 py-0.5 rounded-none border border-emerald-500/40">
                            Connected
                          </span>
                          <div
                            className={cn(
                              'h-5 w-5 rounded-none flex items-center justify-center transition-colors',
                              isSelected ? 'bg-primary text-primary-foreground border border-primary' : 'border border-border'
                            )}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5" />}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="font-display font-bold text-sm">{plat.label}</p>
                        <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          {plat.id === 'INSTAGRAM' ? 'Carousels & Reels' : plat.id === 'LINKEDIN' ? 'Thought Leadership' : 'Infographic Pins'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {visiblePlatforms.length > 0 && visiblePlatforms.length < PLATFORM_OPTIONS.length && (
              <div className="pt-1">
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <span>+ Connect more social platforms in Settings</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          <Separator />

          {/* News Focus & Category Select Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="news-focus" className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" />
                Industry Focus
              </Label>
              <Select value={newsFocus} onValueChange={setNewsFocus} disabled={isGenerating}>
                <SelectTrigger id="news-focus" className="h-10 text-xs font-mono rounded-none border-border">
                  <SelectValue placeholder="Select topic focus" />
                </SelectTrigger>
                <SelectContent>
                  {TOPIC_PRESETS.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs font-mono">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idea-count" className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Number of Ideas
              </Label>
              <Select value={ideaCount} onValueChange={setIdeaCount} disabled={isGenerating}>
                <SelectTrigger id="idea-count" className="h-10 text-xs font-mono rounded-none border-border">
                  <SelectValue placeholder="Select count" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3" className="font-mono text-xs">3 Post Ideas</SelectItem>
                  <SelectItem value="4" className="font-mono text-xs">4 Post Ideas (Recommended)</SelectItem>
                  <SelectItem value="5" className="font-mono text-xs">5 Post Ideas</SelectItem>
                  <SelectItem value="6" className="font-mono text-xs">6 Post Ideas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optional Custom Topic / Keyword */}
          <div className="space-y-2">
            <Label htmlFor="custom-topic" className="text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
                Specific Tech Topic or Keyword (Optional)
              </span>
              <span className="text-[11px] font-mono text-muted-foreground font-normal">Leave blank for top tech headlines</span>
            </Label>
            <Input
              id="custom-topic"
              value={customKeyword}
              onChange={(e) => setCustomKeyword(e.target.value)}
              placeholder="e.g. Claude 3.7 Sonnet, Devin AI, Python 3.13, Nvidia earnings, YC W25 startups..."
              className="h-10 text-xs font-mono rounded-none border-border"
              disabled={isGenerating}
            />
          </div>

          {/* Brand Voice Lock */}
          <div className="flex items-center justify-between gap-3 rounded-none border border-border bg-surface p-3.5 text-xs font-mono">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>Voice & Tone: <strong className="text-foreground">Sarcastic, Opinionated, No-Filter (Coding & Finance Course)</strong></span>
            </div>
            <Badge variant="outline" className="shrink-0 bg-background text-[10px] rounded-none font-mono font-bold">Enforced</Badge>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || selectedPlatforms.length === 0}
            size="lg"
            className="w-full h-11 text-xs font-mono font-bold uppercase tracking-wider gap-2 rounded-none bg-primary text-primary-foreground border border-primary hover:opacity-90 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generating Tech Ideas...</span>
              </>
            ) : selectedPlatforms.length === 0 ? (
              <>
                <AlertCircle className="h-5 w-5" />
                <span>Connect a Platform in Settings to Generate Ideas</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>Generate {ideaCount} Tech Post Ideas ({selectedPlatforms.join(', ')})</span>
              </>
            )}
          </Button>

          {/* Progress / Step Feedback */}
          {isGenerating && (
            <div className="rounded-none border border-primary bg-surface p-4 text-center">
              <p className="text-xs font-mono font-bold text-primary flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {generationStep || 'Scanning tech news & generating ideas...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* News Summary Card if available */}
      {lastSummary && !isGenerating && (
        <Card className="border-border bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Live News Context & Strategist Take
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {lastSummary}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
