'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Instagram as InstagramIcon,
  Linkedin as LinkedinIcon,
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
  Clock,
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

export interface UsedIdeaInfo {
  title: string;
  status: string;
  isPublished: boolean;
  isScheduled: boolean;
  hasDraft: boolean;
  postId?: string;
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
  INSTAGRAM: { name: 'Instagram', icon: <InstagramIcon className="h-3.5 w-3.5" />, color: 'text-foreground' },
  LINKEDIN: { name: 'LinkedIn', icon: <LinkedinIcon className="h-3.5 w-3.5" />, color: 'text-foreground' },
  PINTEREST: { name: 'Pinterest', icon: <span className="inline-flex items-center justify-center w-3.5 h-3.5 border border-current font-mono font-bold text-[9px] leading-none">P</span>, color: 'text-foreground' },
};

const SUGGESTED_PROMPTS = [
  'Scan today\'s top AI model releases & controversies',
  '3 hot-take carousels about developer salaries vs AI tooling',
  '4 practical Docker & Kubernetes optimization tips for engineers',
  'Sarcastic breakdown of Big Tech return-to-office mandates',
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
  const [usedIdeas, setUsedIdeas] = useState<UsedIdeaInfo[]>([]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, activeSearchSources]);

  // Load session messages from DB using dedicated /api/chat/history endpoint
  useEffect(() => {
    setStreamingContent('');
    setActiveSearchSources([]);
    setActiveSearchQuery('');
    setSelectedIdeaIds([]);

    if (!sessionId || sessionId === 'new') {
      setUsedIdeas([]);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            "Welcome to Regardless Ideation Studio. Ask me to brainstorm tech news hooks, propose multi-slide carousels, or explore controversial industry angles for your channels.\n\nLive Tech News Search via Tavily is active to verify current-event facts and breaking announcements.",
        },
      ]);
      return;
    }

    const fetchSessionHistory = async () => {
      try {
        const res = await fetch(`/api/chat/history?sessionId=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.usedIdeas && Array.isArray(data.usedIdeas)) {
            setUsedIdeas(data.usedIdeas);
          } else {
            setUsedIdeas([]);
          }
          if (data.messages && data.messages.length > 0) {
            const mapped: ChatMessageItem[] = data.messages.map((m: any) => {
              const parsedIdeas = m.role === 'assistant' ? extractIdeasFromContent(m.content) : [];
              const meta = (m.metadata as any) || {};
              return {
                id: m.id,
                role: m.role,
                content: m.role === 'assistant' ? cleanAssistantContent(m.content) : m.content,
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
      setUsedIdeas([]);
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            "Welcome to Regardless Ideation Studio. Ask me to brainstorm tech news hooks, propose multi-slide carousels, or explore controversial industry angles for your channels.\n\nLive Tech News Search via Tavily is active to verify current-event facts and breaking announcements.",
        },
      ]);
    };

    fetchSessionHistory();
  }, [sessionId]);

  const getIdeaUsage = (ideaTitle: string): UsedIdeaInfo | undefined => {
    if (!ideaTitle) return undefined;
    const normalized = ideaTitle.trim().toLowerCase();
    return usedIdeas.find((u) => u.title.trim().toLowerCase() === normalized);
  };

  // Helper to extract ideas JSON from assistant response with deduplication
  const extractIdeasFromContent = (text: string): IdeaContent[] => {
    if (!text) return [];
    const ideas: IdeaContent[] = [];
    const seenTitles = new Set<string>();

    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    let match;
    while ((match = jsonBlockRegex.exec(text)) !== null) {
      try {
        const potentialJson = match[1].trim();
        if (potentialJson.startsWith('[') || potentialJson.startsWith('{')) {
          const parsed = JSON.parse(potentialJson);
          const list = Array.isArray(parsed) ? parsed : [parsed];
          for (const item of list) {
            if (item && (item.title || item.name)) {
              const title = String(item.title || item.name || 'Untitled Idea').trim();
              const normalizedTitle = title.toLowerCase();
              if (seenTitles.has(normalizedTitle)) continue;
              seenTitles.add(normalizedTitle);

              ideas.push({
                id: item.id || `idea-${crypto.randomUUID().slice(0, 8)}`,
                title,
                description: item.description || item.concept || item.hook || '',
                platform: (item.platform || selectedPlatforms[0] || 'INSTAGRAM').toUpperCase() as Platform,
                hook: item.hook || title,
                angle: item.angle || '',
                keyPoints: Array.isArray(item.keyPoints) ? item.keyPoints : [],
                suggestedFormat: item.suggestedFormat || 'carousel',
                hashtags: Array.isArray(item.hashtags) ? item.hashtags : ['#tech'],
                cta: item.cta,
              });
            }
          }
        }
      } catch {
        // Continue to next code block if parse fails
      }
    }
    return ideas;
  };

  // Helper to strip raw JSON block cleanly from displayed conversational text
  const cleanAssistantContent = (text: string): string => {
    if (!text) return '';
    let cleaned = text.replace(/```(?:json)?\s*[\{\[][\s\S]*?[\}\]]\s*```/gi, '');
    cleaned = cleaned.replace(/```(?:json)?\s*[\s\S]*?```/gi, '');
    return cleaned.trim();
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
      let streamError: string | null = null;

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
              } else if (data.error) {
                streamError = data.error;
              }
            } catch {
              // Ignore parse errors on stream boundary
            }
          }
        }
      }

      if (streamError && !fullContent) {
        throw new Error(streamError);
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
    } catch (err) {
      console.error('Chat error:', err);
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      const isOllamaDown =
        errMsg.includes('Ollama is not running') ||
        errMsg.includes('ECONNREFUSED') ||
        errMsg.includes('11434');

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: isOllamaDown
            ? `**Ollama is not running on your machine.**\n\nPlease open the **Ollama** application or run \`ollama serve\` in your terminal, then try again.`
            : `Sorry, I encountered an error while processing that request: ${errMsg}`,
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

    const currentSessionId = sessionId && sessionId !== 'new' ? sessionId : undefined;

    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          ideaTitles: targetIdeas.map((i) => i.title),
          ideas: targetIdeas,
        }),
      });

      if (res.ok) {
        const newlyUsed: UsedIdeaInfo[] = targetIdeas.map((i) => ({
          title: i.title,
          status: 'DRAFTED',
          isPublished: false,
          isScheduled: false,
          hasDraft: true,
        }));
        setUsedIdeas((prev) => {
          const map = new Map(prev.map((item) => [item.title.toLowerCase(), item]));
          newlyUsed.forEach((item) => map.set(item.title.toLowerCase(), item));
          return Array.from(map.values());
        });
        setSelectedIdeaIds((prev) => prev.filter((id) => !targetIdeas.some((t) => t.id === id)));
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
              ? 'bg-foreground text-primary border-foreground dark:bg-surface dark:border-primary dark:text-primary font-bold'
              : 'bg-surface border-border text-muted-foreground hover:text-foreground'
          )}
        >
          <Radio className={cn('h-3.5 w-3.5', searchNews ? 'animate-pulse text-primary' : 'text-muted-foreground')} />
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
                  'max-w-[90%] md:max-w-[85%] rounded-none p-4 text-sm leading-relaxed border border-border shadow-[4px_4px_0_0_var(--border)]',
                  isUser
                    ? 'bg-[#0B0B0C] text-[#F4F1EA]'
                    : 'bg-card text-foreground'
                )}
              >
                <div className="whitespace-pre-wrap font-sans text-[13px] md:text-sm">
                  {message.content}
                </div>

                {/* Verified Tavily Live News Sources Display */}
                {message.searchSources && message.searchSources.length > 0 && (
                  <div className="mt-3.5 mb-2 p-3 rounded-none border border-border dark:border-primary/40 bg-surface/70 space-y-2.5 font-mono">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-2">
                      <div className="flex items-center gap-1.5 text-xs text-foreground dark:text-primary font-bold">
                        <Radio className="h-3.5 w-3.5 text-foreground dark:text-primary animate-pulse" />
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
                        <strong className="text-foreground dark:text-primary font-bold">News Brief:</strong> {message.searchAnswer}
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
                              className="flex items-start justify-between gap-2 p-2 bg-background border border-border hover:border-foreground dark:hover:border-primary/60 transition-colors text-xs group"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <p className="font-semibold text-foreground group-hover:text-foreground dark:group-hover:text-primary transition-colors truncate text-[11px]">
                                  {source.title}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                  <span className="text-foreground/80 dark:text-primary font-mono font-semibold">{hostname}</span>
                                  {source.publishedDate && <span>• {source.publishedDate}</span>}
                                </div>
                              </div>
                              <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-foreground dark:group-hover:text-primary shrink-0 mt-0.5" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Embedded In-Stream Post Ideas Group */}
                {message.ideas && message.ideas.length > 0 && (() => {
                  const availableIdeasInMessage = message.ideas.filter((i) => {
                    const u = getIdeaUsage(i.title);
                    return !u || (!u.isPublished && !u.hasDraft && !u.isScheduled);
                  });

                  const allAvailableSelected =
                    availableIdeasInMessage.length > 0 &&
                    availableIdeasInMessage.every((i) => selectedIdeaIds.includes(i.id));

                  return (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className="badge-idea font-mono text-[10px]">
                            {message.ideas.length} IDEAS PROPOSED
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">
                            {availableIdeasInMessage.length > 0
                              ? `${availableIdeasInMessage.length} available to draft`
                              : 'All ideas in this batch have been used'}
                          </span>
                        </div>

                        {/* Select available in this message */}
                        {availableIdeasInMessage.length > 0 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const ids = availableIdeasInMessage.map((i) => i.id);
                              if (allAvailableSelected) {
                                setSelectedIdeaIds((prev) => prev.filter((id) => !ids.includes(id)));
                              } else {
                                setSelectedIdeaIds((prev) => Array.from(new Set([...prev, ...ids])));
                              }
                            }}
                            className="h-6 px-2 text-[10px] font-mono rounded-none border border-border"
                          >
                            {allAvailableSelected
                              ? 'Deselect Available'
                              : `Select Available (${availableIdeasInMessage.length})`}
                          </Button>
                        )}
                      </div>

                      {/* Idea Cards List */}
                      <div className="grid grid-cols-1 gap-2.5">
                        {message.ideas.map((idea) => {
                          const usage = getIdeaUsage(idea.title);
                          const isUsed = Boolean(usage && (usage.isPublished || usage.hasDraft || usage.isScheduled));
                          const isSelected = !isUsed && selectedIdeaIds.includes(idea.id);
                          const isDrafting = draftingIdeaIds[idea.id];

                          return (
                            <div
                              key={idea.id}
                              className={cn(
                                'p-3.5 rounded-none border transition-all',
                                isUsed
                                  ? 'bg-surface/30 opacity-75 border-border/60 hover:opacity-85'
                                  : isSelected
                                  ? 'bg-surface border-primary ring-1 ring-primary'
                                  : 'bg-background border-border hover:border-border/80'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                {isUsed ? (
                                  <div
                                    className="mt-1 h-4 w-4 rounded-none border border-border/60 bg-surface flex items-center justify-center text-muted-foreground shrink-0 select-none cursor-default"
                                    title={
                                      usage?.isPublished
                                        ? 'Post published live on social media'
                                        : usage?.isScheduled
                                        ? 'Post scheduled'
                                        : 'Draft already created'
                                    }
                                  >
                                    <Check className={cn('h-3 w-3', usage?.isPublished ? 'text-emerald-500' : 'text-primary')} />
                                  </div>
                                ) : (
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={() => toggleIdeaSelection(idea.id)}
                                    className="mt-1 rounded-none border-border"
                                  />
                                )}

                                <div className="flex-1 space-y-1.5 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] font-mono rounded-none border-border">
                                      {idea.platform}
                                    </Badge>
                                    <Badge variant="outline" className="text-[10px] font-mono rounded-none border-border bg-surface">
                                      {idea.suggestedFormat}
                                    </Badge>
                                    {isUsed && usage?.isPublished && (
                                      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono rounded-none gap-1 font-semibold">
                                        <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                        Published Live
                                      </Badge>
                                    )}
                                    {isUsed && !usage?.isPublished && usage?.isScheduled && (
                                      <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-mono rounded-none gap-1 font-semibold">
                                        <Clock className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                        Scheduled
                                      </Badge>
                                    )}
                                    {isUsed && !usage?.isPublished && !usage?.isScheduled && (
                                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-mono rounded-none gap-1 font-semibold">
                                        <Check className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                        Draft Created
                                      </Badge>
                                    )}
                                  </div>

                                  <h4 className={cn('font-display font-bold text-sm', isUsed ? 'text-foreground/80' : 'text-foreground')}>
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

                                {isUsed ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className="h-8 text-[11px] font-mono rounded-none border border-border/70 text-muted-foreground hover:text-foreground shrink-0 self-start bg-surface/50"
                                  >
                                    <Link href={usage?.isPublished ? '/history' : '/drafts'}>
                                      <span>{usage?.isPublished ? 'View in History' : 'View in Drafts'}</span>
                                      <ChevronRight className="h-3 w-3 ml-1" />
                                    </Link>
                                  </Button>
                                ) : (
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
                                        <Sparkles className="h-3.5 w-3.5 mr-1 text-foreground dark:text-primary" />
                                        Draft
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Batch Draft Button */}
                      {availableIdeasInMessage.length > 0 && (
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
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}

        {/* Live Streaming Message Bubble */}
        {isGenerating && streamingContent && (
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-foreground dark:text-primary flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin text-foreground dark:text-primary" />
                Regardless AI (Grounded with Tavily News)
              </span>
            </div>
            <div className="max-w-[90%] md:max-w-[85%] rounded-none p-4 text-sm bg-card border border-border dark:border-primary/50 text-foreground">
              {activeSearchSources.length > 0 && (
                <div className="mb-3 p-2 bg-surface border border-border text-xs font-mono text-muted-foreground flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-foreground dark:text-primary animate-pulse" />
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
            <Loader2 className="h-4 w-4 animate-spin text-foreground dark:text-primary" />
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
            className="text-[11px] font-mono px-2.5 py-1 rounded-none border border-border bg-card hover:bg-muted text-foreground whitespace-nowrap transition-none shadow-none font-bold"
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
            className="flex-1 h-11 px-3 text-xs font-mono bg-card border border-border rounded-none text-foreground placeholder:text-muted-foreground focus:outline-2 focus:outline-accent focus:outline-offset-2"
          />
          <Button
            type="submit"
            disabled={isGenerating || !inputMessage.trim()}
            className="h-11 px-5 rounded-none font-mono text-xs font-bold uppercase shrink-0"
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
