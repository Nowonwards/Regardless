'use client';

import { useState, useEffect } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Platform, PostWithRelations, PostStatus } from '@/types';
import { useRouter } from 'next/navigation';

export default function KanbanPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithRelations[]>([]);

  useEffect(() => {
    fetchKanbanPosts();
  }, []);

  const fetchKanbanPosts = async () => {
    try {
      const res = await fetch('/api/kanban');
      const data = await res.json();
      if (data.columns) {
        // Flatten columns into posts array
        const allPosts = data.columns.flatMap((col: any) => col.posts);
        setPosts(allPosts);
      }
    } catch (error) {
      console.error('Failed to fetch kanban posts:', error);
    }
  };

  const handlePostClick = (post: PostWithRelations) => {
    router.push(`/drafts?post=${post.id}`);
  };

  const handleMovePost = async (postId: string, newStatus: PostStatus) => {
    try {
      const res = await fetch('/api/kanban', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? data.post : p))
        );
      }
    } catch (error) {
      console.error('Failed to move post:', error);
    }
  };

  const handleCreatePost = (status: PostStatus) => {
    router.push('/chat');
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <KanbanBoard
        posts={posts}
        onPostClick={handlePostClick}
        onMovePost={handleMovePost}
        onCreatePost={handleCreatePost}
      />
    </div>
  );
}