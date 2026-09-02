'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { IdeasSelector } from '@/components/chat/IdeasSelector';
import { Platform, IdeaContent } from '@/types';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>('');
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([]);
  const [isLoadingPlatforms, setIsLoadingPlatforms] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | undefined>(undefined);
  const [ideas, setIdeas] = useState<IdeaContent[]>([]);
  const [selectedIdeas, setSelectedIdeas] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'ideas'>('chat');

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
    setIdeas(newIdeas);
    setActiveTab('ideas');

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

  useEffect(() => {
    if (!sessionId) return;
    const fetchSessionIdeas = async () => {
      try {
        const res = await fetch(`/api/ideas?sessionId=${sessionId}`);
        const data = await res.json();
        if (data.ideas && data.ideas.length > 0) {
          setIdeas(
            data.ideas.map((i: any) => ({
              id: i.id || i.title,
              title: i.title,
              description: i.description,
              platform: i.platform,
              hook: i.content?.hook || i.description || '',
              angle: i.content?.angle || '',
              keyPoints: Array.isArray(i.content?.keyPoints) ? i.content.keyPoints : [],
              suggestedFormat: i.content?.suggestedFormat || (i.platform === 'PINTEREST' ? 'pin' : 'carousel'),
              hashtags: Array.isArray(i.content?.hashtags) ? i.content.hashtags : ['#tech'],
              cta: i.content?.cta || '',
              createdAt: i.createdAt,
              sessionId: i.sessionId,
              sessionTitle: i.sessionTitle || i.session?.title,
              postStatus: i.postStatus,
              isPublished: Boolean(i.isPublished),
              isScheduled: Boolean(i.isScheduled),
              hasDraft: Boolean(i.hasDraft),
            }))
          );
        }
      } catch (err) {
        console.warn('Failed to fetch session ideas:', err);
      }
    };
    fetchSessionIdeas();
  }, [sessionId]);

  const handleSelectionChange = (ids: string[]) => {
    setSelectedIdeas(ids);
  };

  const handleGenerateDrafts = async () => {
    if (selectedIdeas.length === 0) return;

    setIsGenerating(true);
    try {
      const selectedObjects = ideas.filter(
        (i) => selectedIdeas.includes(i.id) || selectedIdeas.includes(i.title)
      );
      const selectedTitles = selectedObjects.map((i) => i.title);

      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ideaTitles: selectedTitles,
          ideas: selectedObjects,
        }),
      });

      if (res.ok) {
        router.push('/drafts');
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error('Failed to generate drafts:', errData);
      }
    } catch (error) {
      console.error('Failed to generate drafts:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSessionUpdate = (title: string) => {
    // Update session title
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as 'chat' | 'ideas')}
      className="h-[calc(100vh-5.5rem)] flex flex-col w-full overflow-hidden rounded-none border border-border bg-background"
    >
      <div className="border-b border-border px-3 py-2 bg-surface">
        <TabsList className="grid h-9 w-full max-w-md grid-cols-2 rounded-none border border-border bg-background">
          <TabsTrigger value="chat" className="font-mono text-xs">Ideation Studio</TabsTrigger>
          <TabsTrigger value="ideas" className="font-mono text-xs">Post Ideas ({ideas.length})</TabsTrigger>
        </TabsList>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <TabsContent value="chat" className="flex-1 m-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
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

        <TabsContent value="ideas" className="flex-1 m-0 h-full data-[state=active]:flex data-[state=active]:flex-col">
          <IdeasSelector
            ideas={ideas}
            selectedIds={selectedIdeas}
            onSelectionChange={handleSelectionChange}
            onGenerate={handleGenerateDrafts}
            isGenerating={isGenerating}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
