import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateStreamCompletion, OllamaMessage } from '@/lib/ollama';
import { createIdeationPrompt, IDEATION_SYSTEM_PROMPT, formatChatTitle } from '@/lib/agents/prompts';
import {
  executeTavilySearch,
  formatSearchResultsForPrompt,
  determineSearchQueryWithLLM,
} from '@/lib/agents/tools/tavily-search';
import { Platform } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const userSession = await getServerSession(authOptions);
    if (!userSession?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId, platforms, dateRange, searchNews } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const targetPlatforms: Platform[] = platforms?.length ? platforms : ['INSTAGRAM'];

    // Perform live search for tech news for the ideation query if enabled
    let searchResultsText: string | undefined = undefined;
    let searchResultData: any = null;
    let searchQueryUsed: string | null = null;

    if (process.env.TAVILY_API_KEY && searchNews !== false) {
      try {
        // Use LLM to decide whether search is needed and generate the optimal query
        const searchDecision = await determineSearchQueryWithLLM(message);
        if (searchDecision.needed && searchDecision.query) {
          searchQueryUsed = searchDecision.query;
          const searchResult = await executeTavilySearch(searchDecision.query, {
            sessionId: sessionId !== 'new' ? sessionId : undefined,
            topic: 'news',
            maxResults: 5,
          });
          if (searchResult.results && searchResult.results.length > 0) {
            searchResultsText = formatSearchResultsForPrompt(searchResult);
            searchResultData = searchResult;
          }
        }
      } catch (searchError) {
        console.warn('Tavily search error in chat route (continuing without live search):', searchError);
      }
    }

    const calculatedTitle = formatChatTitle(message, searchQueryUsed);

    // Lazy session creation: only create session when user actually communicates!
    let session = sessionId && sessionId !== 'new'
      ? await prisma.chatSession.findUnique({
          where: { id: sessionId },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        })
      : null;

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId: userSession.user.id,
          title: calculatedTitle,
          dateRangeStart: dateRange?.start ? new Date(dateRange.start) : null,
          dateRangeEnd: dateRange?.end ? new Date(dateRange.end) : null,
        },
        include: { messages: true },
      });
    } else if (!session.title || session.title.startsWith('Session ')) {
      // Update generic placeholder title with concise summary of the conversation
      session = await prisma.chatSession.update({
        where: { id: session.id },
        data: { title: calculatedTitle },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }

    const conversationHistory: OllamaMessage[] = (session.messages || []).map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    const prompt = createIdeationPrompt(
      message,
      conversationHistory,
      targetPlatforms,
      dateRange,
      searchResultsText
    );

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = '';

        try {
          // Emit session info so client knows the assigned session ID & title immediately
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'session_info',
              sessionId: session.id,
              title: session.title,
            })}\n\n`)
          );

          // Emit search results immediately if live search was executed
          if (searchResultData) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({
                type: 'search_result',
                query: searchQueryUsed,
                sources: searchResultData.results,
                answer: searchResultData.answer,
              })}\n\n`)
            );
          }

          await generateStreamCompletion(
            prompt,
            { temperature: 0.8 },
            (chunk) => {
              fullContent += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', chunk })}\n\n`));
            }
          );

          await prisma.chatMessage.create({
            data: {
              sessionId: session.id,
              role: 'user',
              content: message,
            },
          });

          await prisma.chatMessage.create({
            data: {
              sessionId: session.id,
              role: 'assistant',
              content: fullContent,
              metadata: searchResultData ? {
                searchQuery: searchQueryUsed,
                searchSources: searchResultData.results,
                searchAnswer: searchResultData.answer,
              } : undefined,
            },
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', done: true, sessionId: session.id, title: session.title, sources: searchResultData?.results })}\n\n`));
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