import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Platform, PostStatus } from '@/types';
import { processScheduledPosts } from '@/lib/jobs/scheduler';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Process any due scheduled posts
    try {
      await processScheduledPosts();
    } catch (e) {
      console.error('[Calendar GET] Background scheduler check error:', e);
    }

    const userId = sessionToken.user.id;
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const platform = searchParams.get('platform') as Platform | null;

    if (!start || !end) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    const where: Record<string, unknown> = {
      userId,
      OR: [
        { scheduledAt: { gte: startDate, lte: endDate } },
        { publishedAt: { gte: startDate, lte: endDate } },
        {
          status: 'POSTED',
          updatedAt: { gte: startDate, lte: endDate },
        },
      ],
      status: { in: ['SCHEDULED', 'POSTED', 'APPROVED'] as PostStatus[] },
    };

    if (platform) where.platform = platform;

    const posts = await prisma.post.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { idea: true },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Calendar fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar' }, { status: 500 });
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
    const { postId, scheduledAt, status } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.userId !== userId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        scheduledAt: scheduledAt ? new Date(scheduledAt) : post.scheduledAt,
        status: status || post.status,
      },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error('Calendar update error:', error);
    return NextResponse.json({ error: 'Failed to update calendar' }, { status: 500 });
  }
}