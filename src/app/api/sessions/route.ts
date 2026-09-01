import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;

    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        ideas: true,
      },
    });

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