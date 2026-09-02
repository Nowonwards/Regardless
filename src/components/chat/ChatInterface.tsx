'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Camera,
  Pin,
  Briefcase,
  Loader2,
  CheckCircle2,
  Check,
  Send,
  Globe,
  Radio,
  RefreshCw,
  Plus,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Platform, IdeaContent } from '@/types';
import { cn } from '@/lib/utils';

export interface TavilySource {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
  score?: number;
}

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  ideas?: IdeaContent[];
  searchSources?: TavilySource[];
  searchQuery?: string;
  searchAnswer?: string;
  createdAt?: string | Date;
}

interface ChatInterfaceProps {
  sessionId: string;
  platforms: Platform[];
  connectedPlatforms?: Platform[];
  isLoadingPlatforms?: boolean;
  dateRange?: { start: Date; end: Date };
  onIdeasGenerated?: (ideas: IdeaContent[]) => void;
  onSessionUpdate?: (title: string, newSessionId?: string) => void;
}

const PLATFORM_CONFIG: Record<Platform, { name: string; icon: React.ReactNode; color: string }> = {
  INSTAGRAM: { name: 'Instagram', icon: <Camera className="h-3 w-3" />, color: 'text-pink-400' },
  LINKEDIN: { name: 'LinkedIn', icon: <Briefcase className="h-3 w-3" />, color: 'text-blue-400' },
  PINTEREST: { name: 'Pinterest', icon: <Pin className="h-3 w-3" />, color: 'text-red-400' },
};

const SUGGESTED_PROMPTS = [
  '⚡ Scan today\'s top AI model releases & controversies',
  '🔥 3 hot-take carousels about developer salaries vs AI tooling',
  '🛠️ 4 practical Docker & Kubernetes optimization tips for engineers',
  '💡 Sarcastic breakdown of Big Tech return-to-office mandates',
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
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const effectiveConnected = connectedPlatforms !== undefined ? connectedPlatforms : initialPlatforms;

  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(() => {
    if (effectiveConnected.length > 0) return effectiveConnected;
    return ['INSTAGRAM'];
  });

  useEffect(() => {
    if (connectedPlatforms && connectedPlatforms.length > 0) {
      setSelectedPlatforms((prev) => {
        const valid = prev.filter((p) => connectedPlatforms.includes(p));
        return valid.length > 0 ? valid : [connectedPlatforms[0]];
      });
    }
  }, [connectedPlatforms]);

  const [searchNews, setSearchNews] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [activeSearchSources, setActiveSearchSources] = useState<TavilySource[]>([]);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');

  // Selected ideas for drafting
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<string[]>([]);
  const [draftingIdeaIds, setDraftingIdeaIds] = useState<Record<string, boolean>>({});
  const [isDraftingBatch, setIsDraftingBatch] = useState(false);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, activeSearchSources]);

  // Load session messages from DB
  useEffect(() => {
    setStreamingContent('');
    setActiveSearchSources([]);
    setActiveSearchQuery('');
    setSelectedIdeaIds([]);

    if (!sessionId || sessionId === 'new') {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            "👋 Welcome to Regardless Ideation Studio. Ask me to brainstorm tech news hooks, propose multi-slide carousels, or explore controversial industry angles for your channels.\n\nLive Tech News Search via Tavily is active to verify current-event facts and breaking announcements.",
        },
      ]);
      return;
    }

    const fetchSessionHistory = async () => {
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) {
          const data = await res.json();
          const current = (data.sessions || []).find((s: any) => s.id === sessionId);
          if (current && current.messages && current.messages.length > 0) {
            const mapped: ChatMessageItem[] = current.messages.map((m: any) => {
              const parsedIdeas = m.role === 'assistant' ? extractIdeasFromContent(m.content) : [];
              const meta = (m.metadata as any) || {};
              return {
                id: m.id,
                role: m.role,
                content: cleanAssistantContent(m.content),
                ideas: parsedIdeas,
                searchSources: meta.searchSources || [],
                searchQuery: meta.searchQuery,
                searchAnswer: meta.searchAnswer,
                createdAt: m.createdAt,
              };
            });
            setMessages(mapped);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to fetch session history:', err);
      }

      // Initial default welcome message if empty
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            "👋 Welcome to Regardless Ideation Studio. Ask me to brainstorm tech news hooks, propose multi-slide carousels, or explore controversial industry angles for your channels.\n\nLive Tech News Search via Tavily is active to verify current-event facts and breaking announcements.",
        },
      ]);
    };

    fetchSessionHistory();
  }, [sessionId]);

  // Helper to extract ideas JSON from assistant response
  const extractIdeasFromContent = (text: string): IdeaContent[] => {
    if (!text) return [];
    const ideas: IdeaContent[] = [];

    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const jsonMatch = text.match(jsonBlockRegex);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        const list = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of list) {
          if (item && (item.title || item.name)) {
            ideas.push({
              id: item.id || `idea-${crypto.randomUUID().slice(0, 8)}`,
              title: item.title || item.name || 'Untitled Idea',
              description: item.description || item.concept || item.hook || '',
              platform: (item.platform || selectedPlatforms[0] || 'INSTAGRAM').toUpperCase() as Platform,
              hook: item.hook || item.title,
              angle: item.angle || '',
              keyPoints: Array.isArray(item.keyPoints) ? item.keyPoints : [],
              suggestedFormat: item.suggestedFormat || 'carousel',
              hashtags: Array.isArray(item.hashtags) ? item.hashtags : ['#tech'],
              cta: item.cta,
            });
          }
        }
      } catch {
        // Fallback to empty if json block is malformed
      }
    }
    return ideas;
  };

  // Helper to strip raw JSON block from displayed conversational text
  const cleanAssistantContent = (text: string): string => {
    return text.replace(/```(?:json)?\s*\[[\s\S]*?\]\s*```/g, '').trim();
  };

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) => {
      if (prev.includes(p)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== p);
      } else {
        return [...prev, p];
      }
    });
  };

  const toggleIdeaSelection = (id: string) => {
    setSelectedIdeaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Send conversational prompt
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isGenerating) return;

    setInputMessage('');

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);
    setStreamingContent('');
    setActiveSearchSources([]);
    setActiveSearchQuery('');

    let latestSources: TavilySource[] = [];
    let latestQuery = '';
    let latestAnswer = '';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          sessionId,
          platforms: selectedPlatforms,
          dateRange,
          searchNews,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'session_info') {
                if (data.sessionId && onSessionUpdate) {
                  onSessionUpdate(data.title || 'Chat', data.sessionId);
                }
              } else if (data.type === 'search_result') {
                latestSources = data.sources || [];
                latestQuery = data.query || '';
                latestAnswer = data.answer || '';
                setActiveSearchSources(latestSources);
                setActiveSearchQuery(latestQuery);
              } else if (data.chunk || data.type === 'chunk') {
                fullContent += (data.chunk || '');
                setStreamingContent(fullContent);
              } else if (data.done || data.type === 'done') {
                if (data.sources && latestSources.length === 0) {
                  latestSources = data.sources;
                }
                if (data.sessionId && onSessionUpdate) {
                  onSessionUpdate(data.title || 'Chat', data.sessionId);
                }
              }
            } catch {
              // Ignore parse errors on stream boundary
            }
          }
        }
      }

      const extractedIdeas = extractIdeasFromContent(fullContent);
      const cleaned = cleanAssistantContent(fullContent);

      const assistantMessage: ChatMessageItem = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: cleaned,
        ideas: extractedIdeas,
        searchSources: latestSources,
        searchQuery: latestQuery,
        searchAnswer: latestAnswer,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent('');
      setActiveSearchSources([]);
      setActiveSearchQuery('');

      if (extractedIdeas.length > 0 && onIdeasGenerated) {
        onIdeasGenerated(extractedIdeas);
      }
      if (onSessionUpdate) {
        onSessionUpdate(latestQuery || 'Chat');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing that request. Please check your network or try again.',
        },
      ]);
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
      setActiveSearchSources([]);
      setActiveSearchQuery('');
    }
  };

  // Generate drafts for selected ideas
  const handleGenerateDrafts = async (specificIdea?: IdeaContent) => {
    const allIdeas = messages.flatMap((m) => m.ideas || []);
    const targetIdeas = specificIdea
      ? [specificIdea]
      : allIdeas.filter((i) => selectedIdeaIds.includes(i.id));

    if (targetIdeas.length === 0) return;

    if (specificIdea) {
      setDraftingIdeaIds((prev) => ({ ...prev, [specificIdea.id]: true }));
    } else {
      setIsDraftingBatch(true);
    }

    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ideaTitles: targetIdeas.map((i) => i.title),
          ideas: targetIdeas,
        }),
      });

      if (res.ok) {
        router.push('/drafts');
      } else {
        const data = await res.json().catch(() => ({}));
        console.error('Draft generation failed:', data);
      }
    } catch (err) {
      console.error('Draft generation error:', err);
    } finally {
      setIsDraftingBatch(false);
      if (specificIdea) {
        setDraftingIdeaIds((prev) => ({ ...prev, [specificIdea.id]: false }));
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative">
      {/* Top Controls Bar */}
      <div className="border-b border-border bg-surface px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mr-1">
            Target Channels:
          </span>
          {(['INSTAGRAM', 'LINKEDIN', 'PINTEREST'] as Platform[]).map((p) => {
            const isSelected = selectedPlatforms.includes(p);
            const cfg = PLATFORM_CONFIG[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={cn(
                  'h-7 px-2.5 rounded-none border text-[11px] font-mono font-semibold inline-flex items-center gap-1.5 transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
                )}
              >
                {cfg.icon}
                <span>{cfg.name}</span>
                {isSelected && <Check className="h-3 w-3" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setSearchNews((prev) => !prev)}
          className={cn(
            'h-7 px-2.5 rounded-none border text-[11px] font-mono inline-flex items-center gap-1.5 transition-all',
            searchNews
              ? 'bg-surface border-primary text-primary font-bold'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Radio className={cn('h-3.5 w-3.5', searchNews && 'animate-pulse text-primary')} />
          <span>Live Tech News Search (Tavily): {searchNews ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={cn(
                'flex flex-col',
                isUser ? 'items-end' : 'items-start'
              )}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  {isUser ? 'You' : 'Regardless AI'}
                </span>
                {message.createdAt && (
                  <span className="text-[10px] font-mono text-muted-foreground/60">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={cn(
                  'max-w-[90%] md:max-w-[85%] rounded-none p-4 text-sm leading-relaxed border',
                  isUser
                    ? 'bg-surface border-primary/50 text-foreground'
                    : 'bg-card border-border text-foreground'
                )}
              >
                <div className="whitespace-pre-wrap font-sans text-[13px] md:text-sm">
                  {message.content}
                </div>

                {/* Verified Tavily Live News Sources Display */}
                {message.searchSources && message.searchSources.length > 0 && (
                  <div className="mt-3.5 mb-2 p-3 rounded-none border border-primary/40 bg-surface/70 space-y-2.5 font-mono">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-2">
                      <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                        <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
                        <span>VERIFIED WITH TAVILY LIVE TECH SEARCH</span>
                      </div>
                      {message.searchQuery && (
                        <span className="text-[10px] text-muted-foreground bg-background px-2 py-0.5 border border-border">
                          Query: &quot;{message.searchQuery}&quot;
                        </span>
                      )}
                    </div>

                    {message.searchAnswer && (
                      <p className="text-xs text-foreground/90 leading-relaxed bg-background/60 p-2 border border-border/50">
                        <strong className="text-primary font-bold">News Brief:</strong> {message.searchAnswer}
                      </p>
                    )}

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Live News Sources Analyzed ({message.searchSources.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {message.searchSources.map((source, sIdx) => {
                          let hostname = '';
                          try {
                            hostname = new URL(source.url).hostname.replace('www.', '');
                          } catch {
                            hostname = 'Source';
                          }
                          return (
                            <a
                              key={sIdx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start justify-between gap-2 p-2 bg-background border border-border hover:border-primary/60 transition-colors text-xs group"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate text-[11px]">
                                  {source.title}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <span className="text-primary font-mono">{hostname}</span>
                                  {source.publishedDate && <span>• {source.publishedDate}</span>}
                                </div>
                              </div>
                              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Embedded In-Stream Post Ideas Group */}
                {message.ideas && message.ideas.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className="badge-idea font-mono text-[10px]">
                          {message.ideas.length} IDEAS PROPOSED
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">
                          Select to generate complete drafts
                        </span>
                      </div>

                      {/* Select all in this message */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const idsInMessage = message.ideas!.map((i) => i.id);
                          const allSelected = idsInMessage.every((id) => selectedIdeaIds.includes(id));
                          if (allSelected) {
                            setSelectedIdeaIds((prev) => prev.filter((id) => !idsInMessage.includes(id)));
                          } else {
                            setSelectedIdeaIds((prev) => Array.from(new Set([...prev, ...idsInMessage])));
                          }
                        }}
                        className="h-6 px-2 text-[10px] font-mono rounded-none border border-border"
                      >
                        {message.ideas.every((i) => selectedIdeaIds.includes(i.id))
                          ? 'Deselect All'
                          : 'Select All in Batch'}
                      </Button>
                    </div>

                    {/* Idea Cards List */}
                    <div className="grid grid-cols-1 gap-2.5">
                      {message.ideas.map((idea) => {
                        const isSelected = selectedIdeaIds.includes(idea.id);
                        const isDrafting = draftingIdeaIds[idea.id];

                        return (
                          <div
                            key={idea.id}
                            className={cn(
                              'p-3.5 rounded-none border transition-all',
                              isSelected
                                ? 'bg-surface border-primary ring-1 ring-primary'
                                : 'bg-background border-border hover:border-border/80'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleIdeaSelection(idea.id)}
                                className="mt-1 rounded-none border-border"
                              />

                              <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
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
                                    <span className="text-primary font-bold">Hook:</span> {idea.hook}
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

                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isDrafting}
                                onClick={() => handleGenerateDrafts(idea)}
                                className="h-8 text-[11px] font-mono rounded-none border-border bg-surface hover:border-primary shrink-0 self-start"
                              >
                                {isDrafting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" />
                                    Draft
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Batch Draft Button */}
                    <div className="flex items-center justify-end pt-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isDraftingBatch || selectedIdeaIds.length === 0}
                        onClick={() => handleGenerateDrafts()}
                        className="h-9 px-4 rounded-none font-mono text-xs font-bold bg-primary text-primary-foreground border border-primary hover:opacity-90"
                      >
                        {isDraftingBatch ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                            Generating Drafts...
                          </>
                        ) : (
                          <>
                            Create Drafts ({selectedIdeaIds.length} selected)
                            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Streaming Message Bubble */}
        {isGenerating && streamingContent && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                Regardless AI (Grounded with Tavily News)
              </span>
            </div>
            <div className="max-w-[90%] md:max-w-[85%] rounded-none p-4 text-sm bg-card border border-primary/50 text-foreground">
              {activeSearchSources.length > 0 && (
                <div className="mb-3 p-2 bg-surface border border-border text-xs font-mono text-muted-foreground flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
                  <span>Found {activeSearchSources.length} live articles for &quot;{activeSearchQuery}&quot;</span>
                </div>
              )}
              <div className="whitespace-pre-wrap font-sans text-sm">
                {cleanAssistantContent(streamingContent)}
              </div>
            </div>
          </div>
        )}

        {isGenerating && !streamingContent && (
          <div className="flex items-center gap-2 p-3 rounded-none bg-surface border border-border text-xs font-mono text-muted-foreground w-fit">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>
              {activeSearchQuery
                ? `Searching Tavily for "${activeSearchQuery}"...`
                : 'Querying Tavily for verified real-time tech news...'}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 border-t border-border bg-surface/50 overflow-x-auto flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider shrink-0">
          Try:
        </span>
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isGenerating}
            onClick={() => handleSendMessage(prompt)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-none border border-border bg-card hover:border-primary text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Pinned Input Form */}
      <div className="p-4 border-t border-border bg-card shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isGenerating}
            placeholder="Ask for ideas, paste a tech news URL, or say 'regenerate idea 2 with a punchier hook'..."
            className="flex-1 h-11 px-3 text-xs font-mono bg-surface border border-border rounded-none text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          />
          <Button
            type="submit"
            disabled={isGenerating || !inputMessage.trim()}
            className="h-11 px-5 rounded-none font-mono text-xs font-bold bg-primary text-primary-foreground border border-primary hover:opacity-90 shrink-0"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4 mr-1.5" />
                Send
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
