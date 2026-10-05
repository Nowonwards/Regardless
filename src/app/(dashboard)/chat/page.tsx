'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { NewsIdeationForm } from '@/components/chat/NewsIdeationForm';
import { ManualPostStudio } from '@/components/chat/ManualPostStudio';
import { Platform, IdeaContent } from '@/types';
import { Sparkles, Radio, Layers, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatSessionSummary {
  id: string;
  title?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  messages?: Array<{ id: string; role: string; content: string }>;
  ideas?: IdeaContent[];
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySessionId = searchParams.get('sessionId');

  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionId, setSessionId] = useState<string>(querySessionId || 'new');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'chat' | 'news-form' | 'manual'>('chat');
  const [injectedIdeas, setInjectedIdeas] = useState<IdeaContent[]>([]);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const res = await fetch('/api/platforms');
        if (res.ok) {
          const data = await res.json();
          const connected = (data.connections || [])
            .filter((c: any) => c.status === 'CONNECTED')
            .map((c: any) => c.platform as Platform);
          setConnectedPlatforms(connected);
          setPlatforms(connected);
        }
      } catch (err) {
        console.error('Failed to fetch platforms:', err);
      } finally {
        setIsLoadingPlatforms(false);
      }
    };
    fetchPlatforms();
  }, []);

  const fetchSessions = useCallback(async (preferSessionId?: string) => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        const fetchedSessions: ChatSessionSummary[] = data.sessions || [];
        setSessions(fetchedSessions);

        const targetId = preferSessionId || querySessionId;
        if (targetId && targetId !== 'new' && fetchedSessions.some((s) => s.id === targetId)) {
          setSessionId(targetId);
        } else if (!targetId || targetId === 'new') {
          setSessionId('new');
        }
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, [querySessionId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Sync state when URL query parameter changes
  useEffect(() => {
    if (querySessionId && sessions.some((s) => s.id === querySessionId)) {
      setSessionId(querySessionId);
    } else if (!querySessionId) {
      setSessionId('new');
    }
  }, [querySessionId, sessions]);

  const handleSelectSession = (val: string) => {
    setSessionId(val);
    if (val === 'new') {
      router.push('/chat');
    } else {
      router.push(`/chat?sessionId=${val}`);
    }
  };

  const handleCreateNewChat = () => {
    setSessionId('new');
    setActiveTab('chat');
    router.push('/chat');
  };

  const handleIdeasGenerated = async (newIdeas: IdeaContent[]) => {
    if (newIdeas.length > 0 && sessionId && sessionId !== 'new') {
      try {
        await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            ideas: newIdeas,
          }),
        });
      } catch (e) {
        console.warn('Auto-persisting ideas to DB failed:', e);
      }
    }
  };

  const handleNewsIdeasSuccess = (ideas: IdeaContent[]) => {
    setInjectedIdeas(ideas);
    setActiveTab('chat');
    handleIdeasGenerated(ideas);
  };

  const handleSessionUpdate = (_title?: string, newSessionId?: string) => {
    const targetSessionId = newSessionId || sessionId;
    if (targetSessionId && targetSessionId !== 'new') {
      setSessionId(targetSessionId);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `/chat?sessionId=${targetSessionId}`);
      }
    }
    fetchSessions(targetSessionId !== 'new' ? targetSessionId : undefined);
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col space-y-6">
      {/* Header row under top bar: page title "Create" and segmented control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-sans font-black text-[34px] leading-tight tracking-tight text-foreground select-none">
          Create
        </h1>

        {/* Segmented Control */}
        <div
          role="tablist"
          aria-label="Create mode"
          className="inline-flex w-full sm:w-auto items-stretch border-2 border-border bg-card p-0 select-none"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
            className={cn(
              'flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-sans font-bold transition-none',
              'border-r-2 border-border',
              activeTab === 'chat'
                ? 'bg-foreground text-background'
                : 'bg-card text-foreground hover:bg-muted'
            )}
          >
            <Sparkles className="hidden sm:inline-block h-4 w-4 shrink-0" aria-hidden="true" />
            <span>AI chat</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'news-form'}
            onClick={() => setActiveTab('news-form')}
            className={cn(
              'flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-sans font-bold transition-none',
              'border-r-2 border-border',
              activeTab === 'news-form'
                ? 'bg-foreground text-background'
                : 'bg-card text-foreground hover:bg-muted'
            )}
          >
            <Radio className="hidden sm:inline-block h-4 w-4 shrink-0" aria-hidden="true" />
            <span>News ideation</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'manual'}
            onClick={() => setActiveTab('manual')}
            className={cn(
              'flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-sans font-bold transition-none',
              activeTab === 'manual'
                ? 'bg-foreground text-background'
                : 'bg-card text-foreground hover:bg-muted'
            )}
          >
            <Layers className="hidden sm:inline-block h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Manual post</span>
          </button>
        </div>
      </div>

      {/* Main Tab Presentation */}
      <div className="w-full flex-1">
        {activeTab === 'chat' && (
          <ChatInterface
            sessionId={sessionId}
            platforms={platforms}
            connectedPlatforms={connectedPlatforms}
            isLoadingPlatforms={isLoadingPlatforms}
            dateRange={dateRange}
            sessions={sessions}
            onSelectSession={handleSelectSession}
            onCreateNewChat={handleCreateNewChat}
            onIdeasGenerated={handleIdeasGenerated}
            onSessionUpdate={handleSessionUpdate}
            injectedIdeas={injectedIdeas}
          />
        )}

        {activeTab === 'news-form' && (
          <NewsIdeationForm
            sessionId={sessionId}
            platforms={platforms}
            connectedPlatforms={connectedPlatforms}
            isLoadingPlatforms={isLoadingPlatforms}
            dateRange={dateRange}
            onIdeasGenerated={handleNewsIdeasSuccess}
            onSessionUpdate={handleSessionUpdate}
          />
        )}

        {activeTab === 'manual' && <ManualPostStudio />}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center border-2 border-border bg-card font-mono text-xs text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-foreground" />
          <span>Loading Create Studio...</span>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}

