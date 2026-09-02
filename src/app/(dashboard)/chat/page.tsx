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
  const [sessionId, setSessionId] = useState<string>('');
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

        if (fetchedSessions.length > 0) {
          const targetId =
            preferSessionId && fetchedSessions.some((s) => s.id === preferSessionId)
              ? preferSessionId
              : fetchedSessions[0].id;
          setSessionId(targetId);
        } else {
          // If user has no sessions yet, create one
          await handleCreateNewChat();
        }
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleCreateNewChat = async () => {
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRangeStart: dateRange?.start,
          dateRangeEnd: dateRange?.end,
        }),
      });
      const data = await res.json();
      if (data.session) {
        const newSession = data.session as ChatSessionSummary;
        setSessions((prev) => [newSession, ...prev.filter((s) => s.id !== newSession.id)]);
        setSessionId(newSession.id);
        setActiveTab('chat');
      }
    } catch (error) {
      console.error('Failed to create new chat session:', error);
    }
  };

  const handleIdeasGenerated = async (newIdeas: IdeaContent[]) => {
    if (newIdeas.length > 0 && sessionId) {
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

  const handleSessionUpdate = () => {
    // Refresh sessions list to update message count and order
    fetchSessions(sessionId);
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
              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
              <Select value={sessionId} onValueChange={(val) => setSessionId(val)}>
                <SelectTrigger className="h-8 min-w-[190px] max-w-[260px] rounded-none border-border bg-background text-[11px] font-mono">
                  <SelectValue placeholder="Chat History..." />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border bg-card max-h-72">
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-[11px] font-mono cursor-pointer">
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span>{formatSessionTimestamp(s.createdAt)}</span>
                        <span className="text-[9px] text-muted-foreground bg-surface px-1 py-0.2 border border-border/80 shrink-0">
                          {s.messages?.length || 0} msgs
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
              <Plus className="h-3.5 w-3.5 text-primary" />
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
