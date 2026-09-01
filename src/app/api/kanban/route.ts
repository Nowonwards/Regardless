import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Platform, PostStatus } from '@/types';

const KANBAN_STATUSES: PostStatus[] = [
  'IDEA',
  'SELECTED',
  'DRAFTED',
  'IN_REVISION',
  'APPROVED',
  'SCHEDULED',
  'POSTED',
  'FAILED',
];

export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as Platform | null;

    const where: Record<string, unknown> = { userId };
    if (platform) where.platform = platform;

    const posts = await prisma.post.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { idea: true },
    });

    const columns = KANBAN_STATUSES.map((status) => ({
      id: status,
      title: formatStatusTitle(status),
      posts: posts
        .filter((p) => p.status === status)
        .map((p) => ({
          id: p.id,
          platform: p.platform,
          title: p.title,
          ideaTitle: p.idea?.title,
          scheduledAt: p.scheduledAt,
          status: p.status,
          updatedAt: p.updatedAt,
        })),
    }));

    return NextResponse.json({ columns });
  } catch (error) {
    console.error('Kanban fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch kanban' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;
    const body = await request.json();
    const { postId, newStatus } = body;

    if (!postId || !newStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!KANBAN_STATUSES.includes(newStatus as PostStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.userId !== userId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { status: newStatus as PostStatus },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error('Kanban update error:', error);
    return NextResponse.json({ error: 'Failed to update kanban' }, { status: 500 });
  }
}

function formatStatusTitle(status: PostStatus): string {
  const titles: Record<PostStatus, string> = {
    IDEA: 'Ideas',
    SELECTED: 'Selected',
    DRAFTED: 'Drafted',
    IN_REVISION: 'In Revision',
    APPROVED: 'Approved',
    SCHEDULED: 'Scheduled',
    POSTED: 'Posted',
    FAILED: 'Failed',
  };
  return titles[status] || status;
}