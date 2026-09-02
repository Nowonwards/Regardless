import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import { formatChatTitle } from '@/lib/agents/prompts';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;

    // Prune abandoned empty sessions where the user never sent a message
    try {
      await prisma.chatSession.deleteMany({
        where: {
          userId,
          messages: {
            none: {
              role: 'user',
            },
          },
        },
      });
    } catch (cleanErr) {
      console.warn('Failed to prune empty sessions:', cleanErr);
    }

    const sessions = await prisma.chatSession.findMany({
      where: {
        userId,
        messages: {
          some: {
            role: 'user',
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        ideas: true,
      },
    });

    // Backfill titles for existing sessions with generic "Session ..." title
    for (const session of sessions) {
      if (!session.title || session.title.startsWith('Session ')) {
        const firstUserMsg = session.messages.find((m) => m.role === 'user');
        if (firstUserMsg) {
          const meta = (firstUserMsg.metadata as any) || {};
          const newTitle = formatChatTitle(firstUserMsg.content, meta.searchQuery);
          session.title = newTitle;
          await prisma.chatSession.update({
            where: { id: session.id },
            data: { title: newTitle },
          });
        }
      }
    }

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Sessions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
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
    const { title, dateRangeStart, dateRangeEnd } = body;

    const session = await prisma.chatSession.create({
      data: {
        userId,
        title: title || `Session ${new Date().toLocaleDateString()}`,
        dateRangeStart: dateRangeStart ? new Date(dateRangeStart) : null,
        dateRangeEnd: dateRangeEnd ? new Date(dateRangeEnd) : null,
      },
    });

    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'system',
        content: 'Welcome! I\'ll help you brainstorm social media post ideas. What platforms are you targeting, and what\'s your goal for this week?',
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Session create error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}