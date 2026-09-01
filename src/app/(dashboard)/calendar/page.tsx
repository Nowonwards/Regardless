'use client';

import { useEffect, useState } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Platform, PostWithRelations } from '@/types';
import { useRouter } from 'next/navigation';

export default function CalendarPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithRelations[]>([]);

  useEffect(() => {
    fetchCalendarPosts();
  }, []);

  const fetchCalendarPosts = async () => {
    try {
      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 60);
      const end = new Date(now);
      end.setDate(end.getDate() + 60);

      const res = await fetch(
        `/api/calendar?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch calendar posts:', error);
    }
  };

  const handlePostClick = (post: PostWithRelations) => {
    if (post.status === 'POSTED') {
      router.push('/history');
    } else {
      router.push(`/drafts?post=${post.id}`);
    }
  };

  const handleCreatePost = (date: Date, platform?: Platform) => {
    router.push(`/chat?date=${date.toISOString()}${platform ? `&platform=${platform}` : ''}`);
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-2.5 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Calendar</h1>
          <p className="text-xs text-muted-foreground">View and manage your scheduled posts</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <CalendarView
          posts={posts}
          onPostClick={handlePostClick}
          onCreatePost={handleCreatePost}
        />
      </div>
    </div>
  );
}
