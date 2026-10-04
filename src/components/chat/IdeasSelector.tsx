'use client';

import { useState, useMemo } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Instagram,
  Linkedin,
  CheckCircle2,
  FileText,
  Calendar,
  Layers,
  Clock,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Platform, IdeaContent } from '@/types';
import { format, isToday, isYesterday } from 'date-fns';

interface IdeasSelectorProps {
  ideas: IdeaContent[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const PLATFORM_COLORS: Record<Platform, { bg: string; text: string; border: string }> = {
  INSTAGRAM: { bg: 'badge-instagram border', text: '', border: 'border-l-[4px] border-l-[#E1306C]' },
  PINTEREST: { bg: 'badge-pinterest border', text: '', border: 'border-l-[4px] border-l-[#E60023]' },
  LINKEDIN: { bg: 'badge-linkedin border', border: 'border-l-[4px] border-l-[#0A66C2]', text: '' },
};

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  INSTAGRAM: <Instagram className="h-3.5 w-3.5" />,
  PINTEREST: <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-current font-mono font-bold text-[9px] leading-none">P</span>,
  LINKEDIN: <Linkedin className="h-3.5 w-3.5" />,
};

const FORMAT_LABELS: Record<string, string> = {
  carousel: 'Carousel',
  'single-image': 'Single Image',
  text: 'Text Post',
  pin: 'Pin',
  video: 'Video',
};

const FORMAT_ICONS: Record<string, React.ReactNode> = {
  carousel: <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect width={8} height={12} x={2} y={6} rx={1} /><path d="M14 6h8v12h-8" /></svg>,
  'single-image': <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect width={18} height={18} x={3} y={3} rx={2} /><circle cx={9} cy={9} r={2} /></svg>,
  text: <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 4h16v16H4z" /><path d="M8 12h8" /><path d="M8 16h5" /></svg>,
  pin: <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 17v5" /><path d="M9 10a3 3 0 0 1 6 0" /></svg>,
  video: <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="23 7 16 12 23 17 23 7" /><rect width={16} height={12} x={2} y={5} rx={2} /></svg>,
};

function formatBatchDate(date: Date): string {
  if (isToday(date)) {
    return `Today at ${format(date, 'h:mm a')}`;
  }
  if (isYesterday(date)) {
    return `Yesterday at ${format(date, 'h:mm a')}`;
  }
  return format(date, 'MMM d, yyyy • h:mm a');
}

export function IdeasSelector({
  ideas,
  selectedIds,
  onSelectionChange,
  onGenerate,
  isGenerating,
}: IdeasSelectorProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'ALL' | 'AVAILABLE' | 'PUBLISHED'>('ALL');

  // Compute status helpers for each idea
  const ideaStatusMap = useMemo(() => {
    const map = new Map<string, { isPublished: boolean; isScheduled: boolean; hasDraft: boolean; isAvailable: boolean }>();
    for (const idea of ideas) {
      const isPublished = Boolean(idea.isPublished || idea.postStatus === 'POSTED');
      const isScheduled = Boolean(idea.isScheduled || idea.postStatus === 'SCHEDULED');
      const hasDraft = Boolean(idea.hasDraft || (idea.postStatus && ['DRAFTED', 'IN_REVISION', 'APPROVED', 'SCHEDULED', 'POSTED'].includes(idea.postStatus)));
      const isAvailable = !isPublished && !isScheduled && !hasDraft;
      map.set(idea.id, { isPublished, isScheduled, hasDraft, isAvailable });
    }
    return map;
  }, [ideas]);

  // Group ideas into batches based on sessionId or timestamp window
  const batches = useMemo(() => {
    const batchMap = new Map<string, {
      id: string;
      timestamp: Date;
      formattedDate: string;
      sessionTitle?: string;
      ideas: IdeaContent[];
    }>();

    ideas.forEach((idea, index) => {
      const date = idea.createdAt ? new Date(idea.createdAt) : new Date();
      // Bucket by sessionId if present, otherwise group by day + 10-minute slot
      const timeSlot = Math.floor(date.getTime() / (10 * 60 * 1000));
      const batchKey = idea.sessionId || `slot-${timeSlot}`;

      if (!batchMap.has(batchKey)) {
        batchMap.set(batchKey, {
          id: batchKey,
          timestamp: date,
          formattedDate: formatBatchDate(date),
          sessionTitle: idea.sessionTitle || undefined,
          ideas: [],
        });
      }

      batchMap.get(batchKey)!.ideas.push(idea);
    });

    // Sort batches by newest first
    return Array.from(batchMap.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .map((batch) => {
        let availableCount = 0;
        let publishedCount = 0;
        let draftedCount = 0;

        batch.ideas.forEach((idea) => {
          const status = ideaStatusMap.get(idea.id);
          if (status?.isPublished) publishedCount++;
          else if (status?.isScheduled || status?.hasDraft) draftedCount++;
          else availableCount++;
        });

        return {
          ...batch,
          availableCount,
          publishedCount,
          draftedCount,
        };
      });
  }, [ideas, ideaStatusMap]);

  const allAvailableIdeas = useMemo(() => {
    return ideas.filter((idea) => ideaStatusMap.get(idea.id)?.isAvailable);
  }, [ideas, ideaStatusMap]);

  const publishedTotal = useMemo(() => {
    return ideas.filter((idea) => ideaStatusMap.get(idea.id)?.isPublished).length;
  }, [ideas, ideaStatusMap]);

  const toggleSelect = (id: string) => {
    const status = ideaStatusMap.get(id);
    if (!status?.isAvailable) return; // Prevent selecting published/drafted ideas

    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAllAvailable = () => {
    onSelectionChange(allAvailableIdeas.map((i) => i.id));
  };

  const deselectAll = () => {
    onSelectionChange([]);
  };

  const toggleBatch = (batchIdeas: IdeaContent[]) => {
    const batchAvailableIds = batchIdeas
      .filter((i) => ideaStatusMap.get(i.id)?.isAvailable)
      .map((i) => i.id);

    const allBatchSelected = batchAvailableIds.length > 0 && batchAvailableIds.every((id) => selectedIds.includes(id));

    if (allBatchSelected) {
      onSelectionChange(selectedIds.filter((id) => !batchAvailableIds.includes(id)));
    } else {
      const newSelected = Array.from(new Set([...selectedIds, ...batchAvailableIds]));
      onSelectionChange(newSelected);
    }
  };

  if (ideas.length === 0) {
    return (
      <TooltipProvider>
        <Card className="h-full rounded-none border border-border" elevation="none">
          <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="p-3 bg-surface border border-border rounded-none mb-4" aria-hidden="true">
              <Sparkles className="h-10 w-10 text-foreground dark:text-primary" />
            </div>
            <h3 className="font-display text-lg font-bold mb-2">No ideas generated yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Start an ideation session in the chat to brainstorm data-driven post ideas.
            </p>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Card className="h-full flex flex-col overflow-hidden rounded-none border border-border bg-card" elevation="none">
        {/* Header with Global Actions & Filter */}
        <CardHeader className="border-b border-border p-4 pb-3" padding="none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="font-display text-base font-bold">Post Ideas Backlog</CardTitle>
              <Badge variant="outline" className="text-[10px] font-mono border">
                {batches.length} Batch{batches.length !== 1 ? 'es' : ''} ({ideas.length} ideas)
              </Badge>
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {/* Filter Pills */}
              <div className="flex items-center bg-surface border border-border p-0.5 rounded-none text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode('ALL')}
                  className={cn(
                    'px-2.5 py-1 rounded-none transition-colors font-mono text-xs font-semibold',
                    filterMode === 'ALL' ? 'bg-primary text-primary-foreground border border-border font-bold' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  All ({ideas.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('AVAILABLE')}
                  className={cn(
                    'px-2.5 py-1 rounded-none transition-colors font-mono text-xs font-semibold',
                    filterMode === 'AVAILABLE' ? 'bg-primary text-primary-foreground border border-border font-bold' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Available ({allAvailableIdeas.length})
                </button>
                {publishedTotal > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterMode('PUBLISHED')}
                    className={cn(
                      'px-2.5 py-1 rounded-none transition-colors font-mono text-xs font-semibold',
                      filterMode === 'PUBLISHED' ? 'bg-primary text-primary-foreground border border-border font-bold' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Published ({publishedTotal})
                  </button>
                )}
              </div>

              <div className="h-4 w-px bg-border mx-1" />

              {/* Selection Summary & Toggles */}
              <Badge variant="outline" className="text-xs gap-1 font-medium font-mono border">
                <CheckCircle2 className="h-3 w-3 text-foreground dark:text-primary" />
                {selectedIds.length} selected
              </Badge>

              {selectedIds.length > 0 && (
                <Button variant="ghost" size="sm" onClick={deselectAll} className="h-7 text-xs px-2 font-mono">
                  Deselect all
                </Button>
              )}

              {allAvailableIdeas.length > 0 && selectedIds.length < allAvailableIdeas.length && (
                <Button variant="ghost" size="sm" onClick={selectAllAvailable} className="h-7 text-xs px-2 font-mono font-bold text-accent">
                  Select available ({allAvailableIdeas.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Batch-Grouped Ideas List */}
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {batches.map((batch, batchIndex) => {
                const visibleBatchIdeas = batch.ideas.filter((idea) => {
                  const status = ideaStatusMap.get(idea.id);
                  if (filterMode === 'AVAILABLE') return status?.isAvailable;
                  if (filterMode === 'PUBLISHED') return status?.isPublished;
                  return true;
                });

                if (visibleBatchIdeas.length === 0) return null;

                const batchAvailableIds = batch.ideas
                  .filter((i) => ideaStatusMap.get(i.id)?.isAvailable)
                  .map((i) => i.id);
                const isBatchFullySelected =
                  batchAvailableIds.length > 0 &&
                  batchAvailableIds.every((id) => selectedIds.includes(id));

                return (
                  <div key={batch.id} className="space-y-3">
                    {/* Batch Header */}
                    <div className="flex items-center justify-between bg-surface border border-border rounded-none px-3.5 py-2 font-mono">
                      <div className="flex items-center gap-2 text-xs font-mono font-medium">
                        <Clock className="h-3.5 w-3.5 text-foreground dark:text-primary" />
                        <span className="font-bold text-foreground">
                          {batch.sessionTitle ? `${batch.sessionTitle} • ` : ''}
                          Batch generated {batch.formattedDate}
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-mono h-5 px-1.5 font-bold rounded-none border border-border">
                          {batch.ideas.length} idea{batch.ideas.length !== 1 ? 's' : ''}
                        </Badge>
                        {batch.publishedCount > 0 && (
                          <Badge variant="outline" className="text-[10px] font-mono h-5 px-1.5 badge-posted border font-bold flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            <span>{batch.publishedCount} Published</span>
                          </Badge>
                        )}
                      </div>

                      {batchAvailableIds.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBatch(batch.ideas)}
                          className="h-6 text-[11px] px-2 font-mono text-muted-foreground hover:text-foreground border border-transparent hover:border-border rounded-none"
                        >
                          {isBatchFullySelected ? 'Deselect Batch' : 'Select Available in Batch'}
                        </Button>
                      )}
                    </div>

                    {/* Batch Ideas Grid / Cards */}
                    <div className="space-y-2.5 pl-1">
                      {visibleBatchIdeas.map((idea) => {
                        const isSelected = selectedIds.includes(idea.id);
                        const isExpanded = expandedIds.includes(idea.id);
                        const status = ideaStatusMap.get(idea.id);
                        const isPublished = status?.isPublished;
                        const isScheduled = status?.isScheduled;
                        const hasDraft = status?.hasDraft;
                        const isAvailable = status?.isAvailable;

                        return (
                          <div
                            key={idea.id}
                            className={cn(
                              'border rounded-none overflow-hidden transition-all duration-100',
                              isPublished
                                ? 'bg-muted/30 border-dashed border-border opacity-70'
                                : isScheduled
                                ? 'bg-surface border-border text-foreground'
                                : hasDraft
                                ? 'bg-surface border-border text-foreground'
                                : isSelected
                                ? 'border-primary bg-card shadow-[4px_4px_0_0_var(--border)]'
                                : 'border-border bg-card hover:shadow-[4px_4px_0_0_var(--border)]'
                            )}
                          >
                            <div className="p-3.5">
                              <div className="flex items-start gap-3">
                                {/* Checkbox / Disabled Indicator */}
                                {isPublished ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="mt-0.5 shrink-0 cursor-not-allowed">
                                        <Checkbox disabled checked={false} className="opacity-40 cursor-not-allowed rounded-none border" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">This idea has already been published.</TooltipContent>
                                  </Tooltip>
                                ) : isScheduled ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="mt-0.5 shrink-0 cursor-not-allowed">
                                        <Checkbox disabled checked={false} className="opacity-40 cursor-not-allowed rounded-none border" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">This idea is currently scheduled for auto-publishing.</TooltipContent>
                                  </Tooltip>
                                ) : hasDraft ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="mt-0.5 shrink-0 cursor-not-allowed">
                                        <Checkbox disabled checked={false} className="opacity-40 cursor-not-allowed rounded-none border" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">A draft is already active in Drafts Studio.</TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleSelect(idea.id)}
                                    className="mt-0.5 shrink-0 cursor-pointer rounded-none border"
                                    aria-label={isSelected ? `Deselect: ${idea.title}` : `Select: ${idea.title}`}
                                  />
                                )}

                                <div
                                  className={cn('flex-1 min-w-0', isAvailable && 'cursor-pointer')}
                                  onClick={() => {
                                    if (isAvailable) toggleSelect(idea.id);
                                    else toggleExpand(idea.id);
                                  }}
                                >
                                  <div className="flex items-center flex-wrap gap-2">
                                    <h4 className={cn('font-bold text-sm font-display', isPublished && 'text-muted-foreground')}>
                                      {idea.title}
                                    </h4>

                                    {/* Publication / Draft Status Pill */}
                                    {isPublished && (
                                      <Badge className="text-[10px] font-mono h-5 px-2 badge-posted border gap-1 font-bold rounded-none">
                                        <Check className="h-3 w-3" />
                                        Published
                                      </Badge>
                                    )}

                                    {isScheduled && (
                                      <Badge className="text-[10px] font-mono h-5 px-2 badge-scheduled border gap-1 font-bold rounded-none">
                                        <Calendar className="h-3 w-3" />
                                        Scheduled
                                      </Badge>
                                    )}

                                    {hasDraft && !isPublished && !isScheduled && (
                                      <Badge className="text-[10px] font-mono h-5 px-2 badge-drafted border gap-1 font-bold rounded-none">
                                        <FileText className="h-3 w-3" />
                                        Draft Active
                                      </Badge>
                                    )}

                                    {/* Platform Badge */}
                                    <Badge variant="outline" className={cn('text-xs font-mono font-bold uppercase rounded-none gap-1', PLATFORM_COLORS[idea.platform]?.bg || '', PLATFORM_COLORS[idea.platform]?.border || '')}>
                                      {PLATFORM_ICONS[idea.platform]}
                                      {idea.platform}
                                    </Badge>

                                    {/* Format Badge */}
                                    <Badge variant="secondary" className="text-xs font-mono uppercase rounded-none border border-border gap-1">
                                      {FORMAT_ICONS[idea.suggestedFormat] || <FileText className="h-3 w-3" />}
                                      {FORMAT_LABELS[idea.suggestedFormat] || idea.suggestedFormat}
                                    </Badge>
                                  </div>

                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {idea.description}
                                  </p>
                                </div>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleExpand(idea.id);
                                      }}
                                      className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0 rounded-none border border-transparent hover:border-border"
                                    >
                                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="left">{isExpanded ? 'Collapse' : 'Expand'} details</TooltipContent>
                                </Tooltip>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="px-4 pb-4 border-t border-border bg-surface">
                                <div className="space-y-3 pt-3">
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    {idea.hook && (
                                      <div>
                                        <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Hook</p>
                                        <p className="text-xs text-foreground/90 font-mono">{idea.hook}</p>
                                      </div>
                                    )}
                                    {idea.angle && (
                                      <div>
                                        <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Angle</p>
                                        <p className="text-xs text-foreground/90 font-mono">{idea.angle}</p>
                                      </div>
                                    )}
                                  </div>

                                  {idea.keyPoints?.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-1">Key Points</p>
                                      <ul className="text-xs space-y-1 pl-4 list-disc text-muted-foreground font-mono">
                                        {idea.keyPoints.map((point, idx) => (
                                          <li key={idx}>{point}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {idea.hashtags?.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-1">Hashtags</p>
                                      <div className="flex flex-wrap gap-1">
                                        {idea.hashtags.map((tag, idx) => (
                                          <Badge key={idx} variant="outline" className="text-[10px] font-mono rounded-none border border-border">{tag}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {idea.cta && (
                                    <div>
                                      <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Call to Action</p>
                                      <p className="text-xs text-foreground dark:text-primary font-mono font-bold">{idea.cta}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>

        {/* Footer Generator Bar */}
        <Separator className="border-border" />
        <CardContent className="p-4 bg-surface border-t border-border">
          <Button
            className="w-full h-11 bg-primary text-primary-foreground font-mono font-bold uppercase tracking-wider hover:opacity-90 border border-border rounded-none shadow-[4px_4px_0_0_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--border)] transition-all duration-100 disabled:opacity-50"
            size="lg"
            onClick={onGenerate}
            disabled={selectedIds.length === 0 || isGenerating}
          >
            {isGenerating ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Drafts...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4.5 w-4.5" />
                Generate {selectedIds.length} Draft{selectedIds.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2 font-mono">
            Each selected idea will become a full draft with slides, images, and captions
          </p>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
