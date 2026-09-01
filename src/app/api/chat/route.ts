import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateStreamCompletion, OllamaMessage } from '@/lib/ollama';
import { createIdeationPrompt, IDEATION_SYSTEM_PROMPT } from '@/lib/agents/prompts';
import {
  executeTavilySearch,
  formatSearchResultsForPrompt,
  isSearchQueryNeeded,
  buildTechNewsSearchQuery,
} from '@/lib/agents/tools/tavily-search';
import { Platform } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const userSession = await getServerSession(authOptions);
    if (!userSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId, platforms, dateRange } = body;

    if (!message || !sessionId || !platforms?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
    });

    if (!session || session.userId !== userSession.user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const conversationHistory: OllamaMessage[] = session.messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    // Perform live search for tech news for the ideation query
    let searchResultsText: string | undefined = undefined;
    if (process.env.TAVILY_API_KEY && isSearchQueryNeeded(message)) {
      try {
        const searchQuery = buildTechNewsSearchQuery(message);
        const searchResult = await executeTavilySearch(searchQuery, {
          sessionId,
          topic: 'news',
          maxResults: 5,
        });
        if (searchResult.results && searchResult.results.length > 0) {
          searchResultsText = formatSearchResultsForPrompt(searchResult);
        }
      } catch (searchError) {
        console.warn('Tavily search error in chat route (continuing without live search):', searchError);
      }
    }

    const prompt = createIdeationPrompt(
      message,
      conversationHistory,
      platforms,
      dateRange,
      searchResultsText
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = '';

        try {
          await generateStreamCompletion(
            prompt,
            { temperature: 0.8 },
            (chunk) => {
              fullContent += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
            }
          );

          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: 'user',
              content: message,
            },
          });

          await prisma.chatMessage.create({
            data: {
              sessionId,
              role: 'assistant',
              content: fullContent,
            },
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Generation failed' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}