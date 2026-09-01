'use client';

import { useState, useEffect, useCallback } from 'react';
import { HistoryView } from '@/components/history/HistoryView';
import { Platform, PostWithRelations, PostStatus } from '@/types';

export default function HistoryPage() {
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchHistory = useCallback(async (loadMore = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        userId: 'user-1',
        limit: '20',
      });
      if (cursor && loadMore) params.append('cursor', cursor);

      const res = await fetch(`/api/history?${params}`);
      const data = await res.json();
      if (data.posts) {
        if (loadMore) {
          setPosts((prev) => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setHasMore(!!data.nextCursor);
        setCursor(data.nextCursor || null);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    fetchHistory(false);
  }, []);

  const handlePostClick = (post: PostWithRelations) => {
    // Open post preview modal
    console.log('Open post:', post.id);
  };

  const handleRetryPublish = async (postId: string) => {
    // Implement retry
  };

  const handleLoadMore = () => {
    fetchHistory(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Post History</h1>
          <p className="text-muted-foreground">View your published posts</p>
        </div>
      </div>

      <HistoryView
        posts={posts}
        onPostClick={handlePostClick}
        onRetryPublish={handleRetryPublish}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoading={isLoading}
      />
    </div>
  );
}