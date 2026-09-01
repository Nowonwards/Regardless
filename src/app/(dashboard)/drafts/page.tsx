'use client';

import { useState, useEffect } from 'react';
import { DraftsList } from '@/components/drafts/DraftsList';
import { Platform, PostStatus, PostWithRelations } from '@/types';

interface PostWithRelationsExtended extends PostWithRelations {
  ideaTitle?: string;
}

export default function DraftsPage() {
  const [posts, setPosts] = useState<PostWithRelationsExtended[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/drafts');
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevise = async (postId: string, feedback: string) => {
    try {
      const res = await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: 'revise', feedback }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? data.post : p))
        );
      }
    } catch (error) {
      console.error('Revision failed:', error);
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      const res = await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: 'approve' }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? data.post : p))
        );
      }
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleSchedule = async (postId: string, date: Date) => {
    try {
      const res = await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: 'schedule', scheduledAt: date.toISOString() }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? data.post : p))
        );
      }
    } catch (error) {
      console.error('Scheduling failed:', error);
    }
  };

  const handlePublish = async (postId: string) => {
    try {
      const res = await fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action: 'publish' }),
      });
      const data = await res.json();
      if (data.success && data.post?.status === 'POSTED') {
        // Post successfully published - remove from Drafts so it only shows in History
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      } else if (data.post) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? data.post : p))
        );
      }
      if (!data.success && data.error) {
        alert(data.error);
      }
    } catch (error) {
      console.error('Publishing failed:', error);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) return;
    try {
      const res = await fetch(`/api/drafts?postId=${postId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Drafts</h1>
          <p className="text-muted-foreground">Review, revise, and approve your post drafts</p>
        </div>
      </div>

      <DraftsList
        posts={posts}
        onRevise={handleRevise}
        onApprove={handleApprove}
        onSchedule={handleSchedule}
        onPublish={handlePublish}
        onDelete={handleDelete}
      />
    </div>
  );
}
