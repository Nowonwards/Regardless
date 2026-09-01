import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Platform, PostStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as Platform | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

    const where: Record<string, unknown> = {
      userId,
      status: 'POSTED' as PostStatus,
    };

    if (platform) where.platform = platform;

    const posts = await prisma.post.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { publishedAt: 'desc' },
      include: {
        idea: true,
        publishAttempts: { orderBy: { attemptedAt: 'desc' } },
      },
    });

    let nextCursor: string | undefined;
    if (posts.length > limit) {
      const nextPost = posts.pop();
      nextCursor = nextPost!.id;
    }

    return NextResponse.json({ posts, nextCursor });
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}