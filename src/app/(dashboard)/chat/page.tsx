'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ManualPostStudio } from '@/components/chat/ManualPostStudio';
import { Platform, IdeaContent } from '@/types';
import { Sparkles, Layers } from 'lucide-react';

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'chat' | 'manual'>('chat');

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

  useEffect(() => {
    // Create or get session
    const createSession = async () => {
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
          setSessionId(data.session.id);
        }
      } catch (error) {
        console.error('Failed to create session:', error);
      }
    };
    createSession();
  }, [dateRange]);

  const handleIdeasGenerated = async (newIdeas: IdeaContent[]) => {
    if (newIdeas.length > 0) {
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

  const handleSessionUpdate = (title: string) => {
    // Update session title if needed
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as 'chat' | 'manual')}
      className="h-[calc(100vh-5.5rem)] flex flex-col w-full overflow-hidden rounded-none border border-border bg-background"
    >
      <div className="border-b border-border px-4 py-2.5 bg-surface shrink-0 flex items-center justify-between">
        <TabsList className="grid h-9 w-full max-w-md grid-cols-2 rounded-none border border-border bg-background p-0.5">
          <TabsTrigger
            value="chat"
            className="font-mono text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Chat & Ideation
          </TabsTrigger>
          <TabsTrigger
            value="manual"
            className="font-mono text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-none gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" />
            Manual Post Studio
          </TabsTrigger>
        </TabsList>
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

        <TabsContent value="manual" className="flex-1 m-0 h-full data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
          <ManualPostStudio />
        </TabsContent>
      </div>
    </Tabs>
  );
}
