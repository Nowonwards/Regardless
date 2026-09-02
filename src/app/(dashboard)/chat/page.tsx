'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { NewsIdeationForm } from '@/components/chat/NewsIdeationForm';
import { ManualPostStudio } from '@/components/chat/ManualPostStudio';
import { Platform, IdeaContent } from '@/types';
import { Sparkles, Layers, RadioTower, Clock, Plus } from 'lucide-react';

interface ChatSessionSummary {
  id: string;
  title?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  messages?: Array<{ id: string; role: string; content: string }>;
  ideas?: IdeaContent[];
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [sessionId, setSessionId] = useState<string>('new');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'chat' | 'news-form' | 'manual'>('chat');

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

  const fetchSessions = async (preferSessionId?: string) => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        const fetchedSessions: ChatSessionSummary[] = data.sessions || [];
        setSessions(fetchedSessions);

        if (preferSessionId === 'new') {
          setSessionId('new');
        } else if (preferSessionId && fetchedSessions.some((s) => s.id === preferSessionId)) {
          setSessionId(preferSessionId);
        } else if (fetchedSessions.length > 0) {
          setSessionId(fetchedSessions[0].id);
        } else {
          setSessionId('new');
        }
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateNewChat = () => {
    // Lazy creation: start fresh in-memory session without creating empty DB record
    setSessionId('new');
    setActiveTab('chat');
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

  const handleSessionUpdate = (_title?: string, newSessionId?: string) => {
    // Refresh sessions list and stay locked to the current or newly initialized session
    fetchSessions(newSessionId || sessionId);
  };

  const formatSessionTimestamp = (dateStr: string | Date): string => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return `Today, ${timeStr}`;
      }
      const datePart = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `${datePart}, ${timeStr}`;
    } catch {
      return String(dateStr);
    }
  };

  const currentSession = sessions.find((s) => s.id === sessionId);

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as 'chat' | 'news-form' | 'manual')}
      className="h-[calc(100vh-5.5rem)] flex flex-col w-full overflow-hidden rounded-none border border-border bg-background"
    >
      <div className="border-b border-border px-4 py-2.5 bg-surface shrink-0 flex flex-wrap items-center justify-between gap-3">
        <TabsList className="grid h-9 w-full max-w-xl grid-cols-3 rounded-none border border-border bg-background p-0.5">
          <TabsTrigger
            value="chat"
            className="font-mono text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Chat & Ideation
          </TabsTrigger>
          <TabsTrigger
            value="news-form"
            className="font-mono text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none gap-1.5"
          >
            <RadioTower className="h-3.5 w-3.5" />
            News Ideation Form
          </TabsTrigger>
          <TabsTrigger
            value="manual"
            className="font-mono text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" />
            Manual Post Studio
          </TabsTrigger>
        </TabsList>

        {/* Chat History Dropdown & New Chat Button */}
        {activeTab === 'chat' && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-foreground dark:text-primary shrink-0" />
              <Select value={sessionId} onValueChange={(val) => setSessionId(val)}>
                <SelectTrigger className="h-8 min-w-[220px] max-w-[320px] rounded-none border-border bg-background text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    {sessionId === 'new' || !currentSession ? (
                      <span className="font-semibold text-foreground dark:text-primary">New Chat (Draft)</span>
                    ) : (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-foreground truncate">
                          {currentSession.title || 'Tech News Ideation'}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          • {formatSessionTimestamp(currentSession.updatedAt || currentSession.createdAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-none border-border bg-card max-h-80 w-[340px]">
                  <SelectItem value="new" className="text-[11px] font-mono cursor-pointer py-2 border-b border-border/50">
                    <div className="flex items-center justify-between gap-2 w-full text-foreground dark:text-primary">
                      <span className="font-bold flex items-center gap-1">
                        <Plus className="h-3 w-3" />
                        Start New Chat
                      </span>
                      <span className="text-[9px] text-muted-foreground">Unsaved draft</span>
                    </div>
                  </SelectItem>

                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-[11px] font-mono cursor-pointer py-2">
                      <div className="flex flex-col gap-0.5 w-full text-left">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-foreground truncate max-w-[210px]">
                            {s.title || 'Tech News Ideation'}
                          </span>
                          <span className="text-[9px] text-muted-foreground bg-surface px-1.5 py-0.2 border border-border/80 shrink-0">
                            {s.messages?.filter((m) => m.role === 'user').length || 1} msgs
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatSessionTimestamp(s.updatedAt || s.createdAt)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCreateNewChat}
              className="h-8 px-2.5 rounded-none border-border bg-surface hover:border-primary text-[11px] font-mono font-semibold gap-1 shrink-0"
            >
              <Plus className="h-3.5 w-3.5 text-foreground dark:text-primary" />
              <span>New Chat</span>
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <TabsContent value="chat" className="flex-1 m-0 h-full data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
          <ChatInterface
            sessionId={sessionId}
            platforms={platforms}
            connectedPlatforms={connectedPlatforms}
            isLoadingPlatforms={isLoadingPlatforms}
            dateRange={dateRange}
            onIdeasGenerated={handleIdeasGenerated}
            onSessionUpdate={handleSessionUpdate}
          />
        </TabsContent>

        <TabsContent value="news-form" className="flex-1 m-0 h-full data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
          <NewsIdeationForm
            sessionId={sessionId}
            platforms={platforms}
            connectedPlatforms={connectedPlatforms}
            isLoadingPlatforms={isLoadingPlatforms}
            dateRange={dateRange}
            onIdeasGenerated={handleIdeasGenerated}
            onSessionUpdate={handleSessionUpdate}
          />
        </TabsContent>

        <TabsContent value="manual" className="flex-1 m-0 h-full data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
          <ManualPostStudio />
        </TabsContent>
      </div>
    </Tabs>
  );
}
