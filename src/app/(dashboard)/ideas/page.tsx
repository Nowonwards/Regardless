'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Sparkles, ChevronRight } from 'lucide-react';
import { IdeasSelector } from '@/components/chat/IdeasSelector';
import { Platform, IdeaContent } from '@/types';
import { useRouter } from 'next/navigation';

export default function IdeasPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<IdeaContent[]>([]);
  const [selectedIdeas, setSelectedIdeas] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
    try {
      const res = await fetch('/api/ideas');
      const data = await res.json();
      if (data.ideas) {
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
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
    }
  };

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

      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaTitles: selectedObjects.map((i) => i.title),
          ideas: selectedObjects,
        }),
      });
      if (res.ok) {
        router.push('/drafts');
      }
    } catch (error) {
      console.error('Failed to generate drafts:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Post Ideas</h1>
          <p className="text-muted-foreground">Review and select ideas to generate drafts</p>
        </div>
        <Button onClick={() => router.push('/chat')}>
          <Plus className="h-4 w-4 mr-2" />
          New Ideation Session
        </Button>
      </div>

      <IdeasSelector
        ideas={ideas}
        selectedIds={selectedIdeas}
        onSelectionChange={handleSelectionChange}
        onGenerate={handleGenerateDrafts}
        isGenerating={isGenerating}
      />

      {ideas.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No ideas selected yet</h3>
            <p className="text-muted-foreground mb-6">
              Start a chat session to brainstorm ideas, then select them here to generate drafts.
            </p>
            <Button onClick={() => router.push('/chat')}>
              <Sparkles className="h-4 w-4 mr-2" />
              Start Ideation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}