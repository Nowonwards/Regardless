import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Platform, PostStatus } from '@/types';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const status = searchParams.get('status') as PostStatus | 'ALL' | null;

    const where: Record<string, unknown> = { userId };
    if (sessionId) where.sessionId = sessionId;
    if (status && status !== 'ALL') where.status = status;

    const ideas = await prisma.idea.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        posts: {
          select: {
            id: true,
            status: true,
            title: true,
            publishedAt: true,
            scheduledAt: true,
          },
        },
        session: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
      },
    });

    const enrichedIdeas = ideas.map((idea) => {
      const isPublished = idea.posts.some((p) => p.status === 'POSTED');
      const isScheduled = idea.posts.some((p) => p.status === 'SCHEDULED');
      const hasDraft = idea.posts.some((p) =>
        ['DRAFTED', 'IN_REVISION', 'APPROVED', 'SCHEDULED', 'POSTED'].includes(p.status)
      );
      const activePost = idea.posts[0];
      const postStatus = isPublished
        ? 'POSTED'
        : isScheduled
        ? 'SCHEDULED'
        : activePost
        ? activePost.status
        : idea.status;

      return {
        ...idea,
        postStatus,
        isPublished,
        isScheduled,
        hasDraft,
        sessionTitle: idea.session?.title,
      };
    });

    return NextResponse.json({ ideas: enrichedIdeas });
  } catch (error) {
    console.error('Get ideas error:', error);
    return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;
    const body = await request.json();

    // 1. Batch creation of ideas
    if (Array.isArray(body.ideas) && body.ideas.length > 0) {
      const { sessionId, ideas } = body;
      const createdIdeas = [];

      for (const item of ideas) {
        if (!item.title) continue;
        const platform = (item.platform || 'INSTAGRAM') as Platform;
        const contentData = item.content || {
          hook: item.hook || '',
          angle: item.angle || '',
          keyPoints: item.keyPoints || [],
          suggestedFormat: item.suggestedFormat || 'carousel',
          hashtags: item.hashtags || [],
          cta: item.cta || '',
        };

        const idea = await prisma.idea.create({
          data: {
            userId,
            sessionId,
            platform,
            title: item.title,
            description: item.description || item.hook || '',
            content: contentData as Prisma.InputJsonValue,
            status: item.selected ? ('SELECTED' as PostStatus) : ('IDEA' as PostStatus),
            selected: item.selected || false,
          },
        });
        createdIdeas.push(idea);
      }

      return NextResponse.json({ success: true, ideas: createdIdeas, count: createdIdeas.length });
    }

    // 2. Single idea creation
    const { sessionId, platform, title, description, content, selected } = body;

    if (!platform || !title || !description || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const idea = await prisma.idea.create({
      data: {
        userId,
        sessionId,
        platform: platform as Platform,
        title,
        description,
        content: content as Prisma.InputJsonValue,
        status: selected ? ('SELECTED' as PostStatus) : ('IDEA' as PostStatus),
        selected: selected || false,
      },
    });

    return NextResponse.json({ idea });
  } catch (error) {
    console.error('Create idea error:', error);
    return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 });
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
    const { ideaIds, selected } = body;

    if (!ideaIds?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await prisma.idea.updateMany({
      where: { id: { in: ideaIds }, userId },
      data: {
        selected: selected ?? true,
        status: selected ? ('SELECTED' as PostStatus) : ('IDEA' as PostStatus),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update ideas error:', error);
    return NextResponse.json({ error: 'Failed to update ideas' }, { status: 500 });
  }
}