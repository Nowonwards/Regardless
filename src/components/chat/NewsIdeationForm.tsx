'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  RadioTower,
  Radio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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

export function NewsIdeationForm({
  sessionId,
  platforms: initialPlatforms,
  connectedPlatforms,
  isLoadingPlatforms = false,
  dateRange,
  onIdeasGenerated,
  onSessionUpdate,
}: NewsIdeationFormProps) {
  const router = useRouter();

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

  // Form generated ideas
  const [generatedIdeas, setGeneratedIdeas] = useState<IdeaContent[]>([]);
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<string[]>([]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [searchSources, setSearchSources] = useState<Array<{ title: string; url: string; content: string; publishedDate?: string }>>([]);
  const [searchQueryUsed, setSearchQueryUsed] = useState<string>('');
  const [searchAnswer, setSearchAnswer] = useState<string>('');

  const togglePlatform = (platform: Platform) => {
    const isConnected = effectiveConnected.includes(platform);
    if (!isConnected) return;

    setSelectedPlatforms((prev) => {
      if (prev.includes(platform)) {
        if (prev.length === 1) return prev;
        return prev.filter((p) => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  const extractIdeasFromResponse = (content: string): IdeaContent[] => {
    if (!content) return [];
    const parsedIdeas: IdeaContent[] = [];

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
                suggestedFormat: item.suggestedFormat || (validPlatform === 'PINTEREST' ? 'pin' : 'carousel'),
                hashtags: Array.isArray(item.hashtags)
                  ? item.hashtags
                  : Array.isArray(item.content?.hashtags)
                  ? item.content.hashtags
                  : ['#tech'],
                cta: item.cta || item.content?.cta,
              });
            }
          }
        }
      } catch {
        // Fallback
      }
    }

    return parsedIdeas;
  };

  const handleGenerate = async () => {
    if (selectedPlatforms.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setGenerationStep('🔍 Connecting to Tavily Live Search radar...');
    setGeneratedIdeas([]);
    setSelectedIdeaIds([]);
    setSearchSources([]);
    setSearchQueryUsed('');
    setSearchAnswer('');

    const topicLabel = TOPIC_PRESETS.find((t) => t.value === newsFocus)?.label || 'All Tech News';
    const messagePrompt = customKeyword.trim()
      ? `Generate ${ideaCount} tech news post ideas focusing on "${customKeyword.trim()}" for ${selectedPlatforms.join(', ')}.`
      : `Generate ${ideaCount} tech news post ideas for ${selectedPlatforms.join(', ')} covering ${topicLabel}.`;

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
              if (data.type === 'search_result') {
                setSearchSources(data.sources || []);
                setSearchQueryUsed(data.query || '');
                setSearchAnswer(data.answer || '');
                setGenerationStep(`💡 Synthesizing hooks from ${data.sources?.length || 5} live articles...`);
              } else if (data.chunk || data.type === 'chunk') {
                fullContent += (data.chunk || '');
              } else if (data.done || data.type === 'done') {
                if (data.sources && (!searchSources || searchSources.length === 0)) {
                  setSearchSources(data.sources);
                }
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
        setGeneratedIdeas(extractedIdeas);
        setSelectedIdeaIds(extractedIdeas.map((i) => i.id));
        if (onIdeasGenerated) {
          onIdeasGenerated(extractedIdeas);
        }
        if (onSessionUpdate) {
          onSessionUpdate(`Tech Ideation: ${customKeyword || topicLabel.slice(0, 30)}`);
        }
      }
    } catch (error) {
      console.error('Ideation generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleCreateDrafts = async () => {
    const selectedObjects = generatedIdeas.filter((i) => selectedIdeaIds.includes(i.id));
    if (selectedObjects.length === 0) return;

    setIsDrafting(true);
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ideaTitles: selectedObjects.map((i) => i.title),
          ideas: selectedObjects,
        }),
      });

      if (res.ok) {
        router.push('/drafts');
      }
    } catch (err) {
      console.error('Failed to create drafts:', err);
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-w-4xl mx-auto w-full">
      {/* Studio Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-none border border-border bg-surface text-foreground dark:text-primary">
            <RadioTower className="h-5 w-5 text-foreground dark:text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">Tech News Ideation Studio</h2>
            <p className="text-xs font-mono text-muted-foreground">
              Configure parameters and run Tavily live news search to batch-generate data-backed post ideas.
            </p>
          </div>
        </div>
      </div>

      {/* Main Parameters Card */}
      <Card className="rounded-none border border-border bg-card" elevation="none">
        <CardHeader className="p-4 border-b border-border bg-surface">
          <CardTitle className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
            <Sliders className="h-4 w-4 text-foreground dark:text-primary" />
            Ideation Parameters
          </CardTitle>
          <CardDescription className="text-xs font-mono text-muted-foreground">
            Choose the target platforms, industry domain, and keyword focus for live news synthesis.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 md:p-6 space-y-5">
          {/* Target Platforms */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono font-bold uppercase tracking-wider">
                Target Platforms (Click to Toggle)
              </Label>
              <span className="text-[11px] font-mono text-muted-foreground">
                {selectedPlatforms.length} Platform(s) Selected
              </span>
            </div>

            {isLoadingPlatforms ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 font-mono">
                <Loader2 className="h-4 w-4 animate-spin text-foreground dark:text-primary" />
                <span>Checking connected platforms...</span>
              </div>
            ) : visiblePlatforms.length === 0 ? (
              <div className="rounded-none border border-border bg-surface p-4 text-center space-y-2">
                <p className="text-xs font-mono text-muted-foreground">
                  No social platforms connected yet.
                </p>
                <Link href="/settings">
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-none font-mono text-xs">
                    <span>Connect Accounts in Settings</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {visiblePlatforms.map((plat) => {
                  const isSelected = selectedPlatforms.includes(plat.id);
                  return (
                    <div
                      key={plat.id}
                      onClick={() => togglePlatform(plat.id)}
                      className={cn(
                        'cursor-pointer rounded-none border p-3 flex flex-col justify-between gap-3 transition-all select-none',
                        isSelected
                          ? 'border-primary bg-surface ring-1 ring-primary'
                          : 'border-border bg-background hover:border-primary/50 opacity-60'
                      )}
                    >
                      <div className="flex items-center justify-between">
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
            )}

            {visiblePlatforms.length > 0 && visiblePlatforms.length < PLATFORM_OPTIONS.length && (
              <div className="pt-1">
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
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
                <Globe className="h-3.5 w-3.5 text-foreground dark:text-primary" />
                Industry Focus
              </Label>
              <Select value={newsFocus} onValueChange={setNewsFocus} disabled={isGenerating}>
                <SelectTrigger id="news-focus" className="h-10 text-xs font-mono rounded-none border-border bg-background">
                  <SelectValue placeholder="Select topic focus" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border">
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
                <Layers className="h-3.5 w-3.5 text-foreground dark:text-primary" />
                Number of Ideas
              </Label>
              <Select value={ideaCount} onValueChange={setIdeaCount} disabled={isGenerating}>
                <SelectTrigger id="idea-count" className="h-10 text-xs font-mono rounded-none border-border bg-background">
                  <SelectValue placeholder="Select count" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border">
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
              className="h-10 text-xs font-mono rounded-none border-border bg-background"
              disabled={isGenerating}
            />
          </div>

          {/* Brand Voice Lock */}
          <div className="flex items-center justify-between gap-3 rounded-none border border-border bg-surface p-3.5 text-xs font-mono">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-foreground dark:text-primary" />
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
            <div className="rounded-none border border-border dark:border-primary bg-surface p-4 text-center">
              <p className="text-xs font-mono font-bold text-foreground dark:text-primary flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {generationStep || 'Scanning tech news & generating ideas...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verified Tavily Search Sources Output Section */}
      {searchSources.length > 0 && (
        <Card className="rounded-none border border-border dark:border-primary/50 bg-card" elevation="none">
          <CardHeader className="p-3 border-b border-border bg-surface flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-foreground dark:text-primary animate-pulse" />
              <CardTitle className="text-xs font-mono font-bold uppercase tracking-wider text-foreground dark:text-primary">
                Tavily Live Search Verified
              </CardTitle>
            </div>
            {searchQueryUsed && (
              <Badge variant="outline" className="text-[10px] font-mono rounded-none border-border bg-background">
                Query: &quot;{searchQueryUsed}&quot;
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 font-mono text-xs">
            {searchAnswer && (
              <div className="p-2.5 bg-surface border border-border/80 text-foreground leading-relaxed">
                <span className="text-foreground dark:text-primary font-bold">News Brief: </span>
                {searchAnswer}
              </div>
            )}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Verified Articles ({searchSources.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchSources.map((source, idx) => {
                  let hostname = '';
                  try {
                    hostname = new URL(source.url).hostname.replace('www.', '');
                  } catch {
                    hostname = 'Source';
                  }
                  return (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-surface border border-border hover:border-foreground dark:hover:border-primary transition-colors block group"
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <span className="text-[10px] font-mono text-foreground/80 dark:text-primary font-bold uppercase">{hostname}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground dark:group-hover:text-primary shrink-0" />
                      </div>
                      <p className="font-display font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {source.title}
                      </p>
                      {source.publishedDate && (
                        <p className="text-[9px] text-muted-foreground mt-1">
                          Published: {source.publishedDate}
                        </p>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Ideas Output Section */}
      {generatedIdeas.length > 0 && (
        <Card className="rounded-none border border-border bg-card" elevation="none">
          <CardHeader className="p-4 border-b border-border bg-surface flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-mono font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-foreground dark:text-primary" />
                Generated Ideas ({generatedIdeas.length})
              </CardTitle>
              <CardDescription className="text-xs font-mono text-muted-foreground">
                Select ideas below to generate complete slide copy and drafts.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedIdeaIds.length === generatedIdeas.length) {
                    setSelectedIdeaIds([]);
                  } else {
                    setSelectedIdeaIds(generatedIdeas.map((i) => i.id));
                  }
                }}
                className="h-7 text-[11px] font-mono rounded-none border-border"
              >
                {selectedIdeaIds.length === generatedIdeas.length ? 'Deselect All' : 'Select All'}
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={isDrafting || selectedIdeaIds.length === 0}
                onClick={handleCreateDrafts}
                className="h-7 px-3 text-[11px] font-mono font-bold rounded-none bg-primary text-primary-foreground border border-primary"
              >
                {isDrafting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    Create Drafts ({selectedIdeaIds.length})
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {generatedIdeas.map((idea) => {
              const isSelected = selectedIdeaIds.includes(idea.id);
              return (
                <div
                  key={idea.id}
                  className={cn(
                    'p-3.5 rounded-none border transition-all',
                    isSelected
                      ? 'bg-surface border-border dark:border-primary ring-1 ring-border dark:ring-primary'
                      : 'bg-background border-border hover:border-border/80'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() =>
                        setSelectedIdeaIds((prev) =>
                          prev.includes(idea.id)
                            ? prev.filter((id) => id !== idea.id)
                            : [...prev, idea.id]
                        )
                      }
                      className="mt-1 rounded-none border-border"
                    />

                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono rounded-none border-border">
                          {idea.platform}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-mono rounded-none border-border bg-surface">
                          {idea.suggestedFormat}
                        </Badge>
                      </div>

                      <h4 className="font-display font-bold text-sm text-foreground">
                        {idea.title}
                      </h4>

                      {idea.hook && (
                        <p className="text-xs font-mono text-muted-foreground">
                          <span className="text-foreground dark:text-primary font-bold">Hook:</span> {idea.hook}
                        </p>
                      )}

                      {idea.angle && (
                        <p className="text-xs font-mono text-muted-foreground/80">
                          <span className="text-foreground font-semibold">Angle:</span> {idea.angle}
                        </p>
                      )}

                      {idea.keyPoints && idea.keyPoints.length > 0 && (
                        <ul className="text-[11px] font-mono text-muted-foreground list-disc list-inside pt-1 space-y-0.5">
                          {idea.keyPoints.map((pt, idx) => (
                            <li key={idx} className="truncate">{pt}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* News Summary Card if available */}
      {lastSummary && !isGenerating && (
        <Card className="rounded-none border border-border bg-card/60" elevation="none">
          <CardHeader className="p-3 border-b border-border bg-surface">
            <CardTitle className="text-xs font-mono font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-wider">
              <Globe className="h-4 w-4 text-foreground dark:text-primary" />
              Live News Context & Strategist Take
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-xs font-mono leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {lastSummary}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
