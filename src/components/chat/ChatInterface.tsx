'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Instagram as InstagramIcon,
  Linkedin as LinkedinIcon,
  Loader2,
  Send,
  Plus,
  ExternalLink,
  ChevronRight,
  Check,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle-switch';
import { Platform, IdeaContent } from '@/types';
import { cn } from '@/lib/utils';
import { ChatSessionSummary } from '@/app/(dashboard)/chat/page';

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
  sessions?: ChatSessionSummary[];
  onSelectSession?: (id: string) => void;
  onCreateNewChat?: () => void;
  onIdeasGenerated?: (ideas: IdeaContent[]) => void;
  onSessionUpdate?: (title: string, newSessionId?: string) => void;
  injectedIdeas?: IdeaContent[];
}

const SUGGESTION_CARDS = [
  {
    title: "Scan today's top AI model releases",
    description: 'Pulls live headlines and finds the controversial angle.',
    prompt: "Scan today's top AI model releases, controversies, and product launches.",
  },
  {
    title: '3 hot-take carousels on developer salaries vs AI tooling',
    description: 'Opinionated hooks, six slides each.',
    prompt: 'Brainstorm 3 hot-take carousels on developer salaries vs AI tooling with 6 slides each.',
  },
  {
    title: '4 practical Docker and Kubernetes tips',
    description: 'Short, concrete, code-first slides.',
    prompt: 'Create 4 practical Docker and Kubernetes tips as short, concrete, code-first slides.',
  },
  {
    title: 'Turn a news URL into a carousel',
    description: 'Paste a link and get a hook and slide outline.',
    prompt: 'Help me turn a recent tech news article or URL into an engaging carousel deck.',
  },
];

export function ChatInterface({
  sessionId,
  platforms: initialPlatforms,
  connectedPlatforms,
  isLoadingPlatforms = false,
  dateRange,
  sessions = [],
  onSelectSession,
  onCreateNewChat,
  onIdeasGenerated,
  onSessionUpdate,
  injectedIdeas,
}: ChatInterfaceProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  const [isDraftingBatch, setIsDraftingBatch] = useState(false);
  const [usedIdeas, setUsedIdeas] = useState<UsedIdeaInfo[]>([]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, activeSearchSources]);

  // Adjust textarea height dynamically
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(64, textareaRef.current.scrollHeight)}px`;
    }
  }, [inputMessage]);

  // Load session messages from DB
  useEffect(() => {
    setStreamingContent('');
    setActiveSearchSources([]);
    setActiveSearchQuery('');
    setSelectedIdeaIds([]);

    if (!sessionId || sessionId === 'new') {
      setUsedIdeas([]);
      setMessages([]);
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

      setUsedIdeas([]);
      setMessages([]);
    };

    fetchSessionHistory();
  }, [sessionId]);

  // Listen to injected ideas from news form tab
  useEffect(() => {
    if (injectedIdeas && injectedIdeas.length > 0) {
      const newMsg: ChatMessageItem = {
        id: `ideas-${Date.now()}`,
        role: 'assistant',
        content: 'Here are the tech news post ideas generated for your selected channels:',
        ideas: injectedIdeas,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, newMsg]);
      setSelectedIdeaIds(injectedIdeas.map((i) => i.id));
    }
  }, [injectedIdeas]);

  const getIdeaUsage = (ideaTitle: string): UsedIdeaInfo | undefined => {
    if (!ideaTitle) return undefined;
    const normalized = ideaTitle.trim().toLowerCase();
    return usedIdeas.find((u) => u.title.trim().toLowerCase() === normalized);
  };

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
        // Continue
      }
    }
    return ideas;
  };

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
                fullContent += data.chunk || '';
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
              // Ignore boundary parse errors
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
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, I encountered an error while processing that request: ${errMsg}`,
        },
      ]);
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
      setActiveSearchSources([]);
      setActiveSearchQuery('');
    }
  };

  const handleGenerateDrafts = async () => {
    const allIdeas = messages.flatMap((m) => m.ideas || []);
    const targetIdeas = allIdeas.filter((i) => selectedIdeaIds.includes(i.id));
    if (targetIdeas.length === 0) return;

    setIsDraftingBatch(true);
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
      }
    } catch (err) {
      console.error('Draft generation error:', err);
    } finally {
      setIsDraftingBatch(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const platformDisplayNames: Record<Platform, string> = {
    INSTAGRAM: 'Instagram',
    LINKEDIN: 'LinkedIn',
    PINTEREST: 'Pinterest',
  };

  const platformSummary = selectedPlatforms.map((p) => platformDisplayNames[p]).join(', ');
  const setupSummary = `${platformSummary || 'No channel'} · live news ${searchNews ? 'on' : 'off'}`;

  const allAvailableIdeas = messages.flatMap((m) => m.ideas || []);
  const selectedCount = selectedIdeaIds.length;

  return (
    <div className="flex flex-col min-[1080px]:flex-row gap-6 w-full min-h-[520px] min-[1080px]:h-[calc(100vh-170px)]">
      {/* Thread on Left (Flex 1) */}
      <div className="flex-1 flex flex-col min-w-0 max-[1079px]:order-2 max-[1079px]:h-[70vh] h-full">
        {/* Scrolling Message Area */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-4">
          {messages.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col justify-center h-full py-8 max-w-2xl mx-auto">
              <h2 className="font-sans font-black text-[clamp(28px,4vw,44px)] leading-tight tracking-tight text-foreground">
                What should we post about?
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Ask for ideas, paste a news link, or start from a suggestion.
              </p>

              {/* 2x2 Suggestion Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
                {SUGGESTION_CARDS.map((card, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(card.prompt)}
                    className="border-2 border-border bg-card p-[14px] text-left transition-transform hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[5px_5px_0_0_var(--border)] group"
                  >
                    <h3 className="font-sans font-bold text-[15px] text-foreground leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-muted-foreground text-[13px] mt-1 leading-normal">
                      {card.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages List */
            <>
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
                    {/* Message Bubble */}
                    <div
                      className={cn(
                        'p-4 text-sm leading-relaxed border-2 border-border',
                        isUser
                          ? 'bg-[#0B0B0C] text-[#F4F1EA] max-w-[78%]'
                          : 'bg-card text-foreground w-full'
                      )}
                    >
                      <div className="whitespace-pre-wrap font-sans text-sm">
                        {message.content}
                      </div>

                      {/* Search Sources Display */}
                      {message.searchSources && message.searchSources.length > 0 && (
                        <div className="mt-3 p-3 border-2 border-border bg-muted/30 space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono font-bold">
                            <span className="text-foreground">Verified Tavily Live Sources ({message.searchSources.length})</span>
                            {message.searchQuery && (
                              <span className="text-muted-foreground text-[11px] truncate max-w-[200px]">
                                &quot;{message.searchQuery}&quot;
                              </span>
                            )}
                          </div>
                          {message.searchAnswer && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {message.searchAnswer}
                            </p>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
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
                                  className="flex items-center justify-between gap-1 p-1.5 border border-border bg-card text-[11px] hover:text-primary truncate"
                                >
                                  <span className="truncate">{source.title || hostname}</span>
                                  <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Assistant Ideas Selectable Cards */}
                      {message.ideas && message.ideas.length > 0 && (
                        <div className="mt-4 pt-3 border-t-2 border-border space-y-3">
                          <div className="grid grid-cols-1 gap-2.5">
                            {message.ideas.map((idea) => {
                              const usage = getIdeaUsage(idea.title);
                              const isUsed = Boolean(usage && (usage.isPublished || usage.hasDraft || usage.isScheduled));
                              const isSelected = selectedIdeaIds.includes(idea.id);

                              return (
                                <div
                                  key={idea.id}
                                  onClick={() => !isUsed && toggleIdeaSelection(idea.id)}
                                  className={cn(
                                    'p-3.5 border-2 transition-all cursor-pointer select-none',
                                    isSelected
                                      ? 'border-[#1F3DFF] shadow-[4px_4px_0_0_#1F3DFF] bg-card'
                                      : 'border-border bg-card hover:border-[#1F3DFF]/60'
                                  )}
                                >
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={isUsed}
                                      onChange={() => toggleIdeaSelection(idea.id)}
                                      className="h-5 w-5 rounded-none border-2 border-border accent-[#1F3DFF] cursor-pointer mt-0.5 shrink-0"
                                      aria-label={`Select ${idea.title}`}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-sans font-bold text-[15px] text-foreground leading-snug">
                                        {idea.title}
                                      </h4>
                                      {idea.hook && (
                                        <p className="text-muted-foreground text-xs mt-1 leading-normal">
                                          Hook: {idea.hook}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground font-mono">
                                        <span>{idea.keyPoints?.length || 6} slides</span>
                                        <span>•</span>
                                        <span className="uppercase">{idea.platform}</span>
                                        {isUsed && (
                                          <span className="text-primary font-bold">• Already drafted</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Draft N Selected Button */}
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={handleGenerateDrafts}
                              disabled={selectedCount === 0 || isDraftingBatch}
                              className={cn(
                                'font-sans font-bold text-xs px-4 py-2 border-2 border-border transition-all flex items-center gap-2',
                                selectedCount > 0
                                  ? 'bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px]'
                                  : 'bg-primary text-primary-foreground opacity-45 cursor-not-allowed shadow-none'
                              )}
                            >
                              {isDraftingBatch ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  <span>Drafting ideas...</span>
                                </>
                              ) : (
                                <span>Draft {selectedCount} selected</span>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Streaming Content */}
              {isGenerating && streamingContent && (
                <div className="flex flex-col items-start w-full">
                  <div className="p-4 border-2 border-border bg-card text-foreground w-full">
                    {activeSearchSources.length > 0 && (
                      <div className="mb-2 text-xs font-mono text-muted-foreground">
                        Found {activeSearchSources.length} live articles for &quot;{activeSearchQuery}&quot;
                      </div>
                    )}
                    <div className="whitespace-pre-wrap font-sans text-sm">
                      {cleanAssistantContent(streamingContent)}
                    </div>
                  </div>
                </div>
              )}

              {isGenerating && !streamingContent && (
                <div className="flex items-center gap-2 p-3 border-2 border-border bg-card text-xs font-mono text-muted-foreground w-fit">
                  <Loader2 className="h-4 w-4 animate-spin text-foreground" />
                  <span>
                    {activeSearchQuery
                      ? `Searching Tavily for "${activeSearchQuery}"...`
                      : 'Searching live tech news via Tavily...'}
                  </span>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Pinned Composer */}
        <div className="shrink-0 pt-2">
          <div className="border-2 border-border bg-card shadow-[5px_5px_0_0_var(--border)]">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isGenerating}
              placeholder="Ask for ideas, paste a news link, or start from a suggestion..."
              className="w-full min-h-[64px] p-3 text-sm font-sans bg-transparent text-foreground placeholder:text-muted-foreground resize-none border-none outline-none focus:outline-none focus:ring-0 leading-relaxed"
              rows={2}
            />

            <div className="border-t-2 border-border px-3 py-2 flex items-center justify-between gap-3 bg-card">
              <span className="font-mono text-xs text-muted-foreground truncate">
                {setupSummary}
              </span>

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isGenerating || !inputMessage.trim()}
                className={cn(
                  'bg-primary text-primary-foreground border-2 border-border font-sans font-bold text-xs px-4 py-1.5 inline-flex items-center gap-1.5 transition-transform shrink-0',
                  inputMessage.trim() && !isGenerating
                    ? 'shadow-[3px_3px_0_0_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]'
                    : 'opacity-40 cursor-not-allowed shadow-none'
                )}
                aria-label="Send message"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Rail (300px wide, stacked, gap 18px) */}
      <div className="w-full min-[1080px]:w-[300px] shrink-0 flex flex-col gap-[18px] overflow-y-auto max-[1079px]:order-1">
        {/* Panel 1: Channels */}
        <div className="border-2 border-border bg-card p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-border">
            <h3 className="font-sans font-bold text-base text-foreground">Channels</h3>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {selectedPlatforms.length} on
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {(
              [
                {
                  id: 'INSTAGRAM' as Platform,
                  name: 'Instagram',
                  icon: <InstagramIcon className="h-4 w-4" />,
                },
                {
                  id: 'LINKEDIN' as Platform,
                  name: 'LinkedIn',
                  icon: <LinkedinIcon className="h-4 w-4" />,
                },
                {
                  id: 'PINTEREST' as Platform,
                  name: 'Pinterest',
                  icon: <span className="font-mono font-bold text-xs">P</span>,
                },
              ] as const
            ).map((item) => {
              const isConnected = effectiveConnected.includes(item.id);
              const isOn = selectedPlatforms.includes(item.id);

              return (
                <div key={item.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-[30px] h-[30px] border-2 border-border bg-background flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-sans font-bold text-sm text-foreground truncate">
                        {item.name}
                      </span>
                      {isConnected ? (
                        <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          Connected
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          Not connected
                        </span>
                      )}
                    </div>
                  </div>

                  {isConnected ? (
                    <Toggle
                      checked={isOn}
                      onCheckedChange={() => togglePlatform(item.id)}
                      aria-label={`Toggle ${item.name}`}
                    />
                  ) : (
                    <Link
                      href="/settings"
                      className="border-2 border-border bg-card px-2.5 py-1 text-xs font-sans font-bold hover:bg-muted shrink-0 text-foreground"
                    >
                      Connect
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel 2: Live Tech News Search */}
        <div className="border-2 border-border bg-card p-4 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="font-sans font-bold text-sm text-foreground">Live tech news search</h3>
            <p className="text-xs text-muted-foreground leading-snug">
              Checks facts with Tavily before drafting.
            </p>
          </div>
          <Toggle
            checked={searchNews}
            onCheckedChange={setSearchNews}
            aria-label="Toggle Live tech news search"
          />
        </div>

        {/* Panel 3: Recent Chats with "+ New Chat" Button */}
        <div className="border-2 border-border bg-card p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b-2 border-border">
            <h3 className="font-sans font-bold text-base text-foreground">Recent chats</h3>
            <button
              type="button"
              onClick={onCreateNewChat}
              className="bg-primary text-primary-foreground border-2 border-border shadow-[3px_3px_0_0_var(--border)] font-sans font-bold text-[13px] px-[11px] py-[5px] inline-flex items-center gap-1.5 transition-transform hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_var(--border)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_var(--border)]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New chat</span>
            </button>
          </div>

          <div className="flex flex-col divide-y-2 divide-border pt-1">
            {sessions.length === 0 ? (
              <p className="text-xs font-mono text-muted-foreground py-3">No recent chats yet</p>
            ) : (
              sessions.map((s) => {
                const isActive = s.id === sessionId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectSession && onSelectSession(s.id)}
                    className={cn(
                      'py-2.5 text-left w-full flex items-center justify-between gap-2 transition-none hover:text-primary',
                      isActive ? 'font-bold text-foreground' : 'text-foreground/80'
                    )}
                  >
                    <span className="truncate text-xs font-sans">
                      {s.title || 'Tech News Ideation'}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

