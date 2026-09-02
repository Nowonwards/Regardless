import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { tavily } from '@tavily/core';

export interface TavilySearchItem {
  title: string;
  url: string;
  content: string;
  score?: number;
  publishedDate?: string;
}

export interface TavilySearchResult {
  query: string;
  answer?: string;
  results: TavilySearchItem[];
  cached?: boolean;
}

interface CacheEntry {
  data: TavilySearchResult;
  timestamp: number;
}

// Per-session search cache: sessionId -> normalized query -> CacheEntry
const sessionSearchCache = new Map<string, Map<string, CacheEntry>>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes TTL

/**
 * Normalizes query string for cache keying
 */
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Retrieves cached search result if available for the given session and query
 */
export function getCachedSearchResult(sessionId: string, query: string): TavilySearchResult | null {
  if (!sessionId) return null;
  const sessionMap = sessionSearchCache.get(sessionId);
  if (!sessionMap) return null;

  const key = normalizeQuery(query);
  const entry = sessionMap.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    sessionMap.delete(key);
    return null;
  }

  return { ...entry.data, cached: true };
}

/**
 * Stores search results in the per-session cache
 */
export function setCachedSearchResult(sessionId: string, query: string, data: TavilySearchResult): void {
  if (!sessionId) return;
  if (!sessionSearchCache.has(sessionId)) {
    sessionSearchCache.set(sessionId, new Map());
  }

  const sessionMap = sessionSearchCache.get(sessionId)!;
  const key = normalizeQuery(query);
  sessionMap.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clears search cache for a specific session
 */
export function clearSessionSearchCache(sessionId: string): void {
  sessionSearchCache.delete(sessionId);
}

/**
 * Core Tavily search execution function with session-level caching
 */
export async function executeTavilySearch(
  query: string,
  options?: {
    sessionId?: string;
    topic?: 'general' | 'news';
    maxResults?: number;
    searchDepth?: 'basic' | 'advanced';
  }
): Promise<TavilySearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not configured in environment variables');
  }

  const sessionId = options?.sessionId;
  if (sessionId) {
    const cached = getCachedSearchResult(sessionId, query);
    if (cached) {
      return cached;
    }
  }

  const client = tavily({ apiKey });

  const searchResponse = await client.search(query, {
    topic: options?.topic || 'news',
    searchDepth: options?.searchDepth || 'basic',
    maxResults: options?.maxResults || 5,
    includeAnswer: true,
  });

  const formattedResult: TavilySearchResult = {
    query,
    answer: searchResponse.answer || undefined,
    results: (searchResponse.results || []).map((item) => ({
      title: item.title,
      url: item.url,
      content: item.content,
      score: item.score,
      publishedDate: item.publishedDate,
    })),
    cached: false,
  };

  if (sessionId) {
    setCachedSearchResult(sessionId, query, formattedResult);
  }

  return formattedResult;
}

/**
 * Formats search results into a clean markdown block with citations for LLM prompt injection
 */
export function formatSearchResultsForPrompt(searchResult: TavilySearchResult): string {
  if (!searchResult.results || searchResult.results.length === 0) {
    return 'No verified search results found.';
  }

  let formatted = `### Verified Tech News / Live Search Results (Query: "${searchResult.query}")\n`;
  if (searchResult.cached) {
    formatted += `*(Retrieved from conversation session cache)*\n`;
  }
  if (searchResult.answer) {
    formatted += `\n**Summary:** ${searchResult.answer}\n\n`;
  }

  formatted += `**Sources & Facts:**\n`;
  searchResult.results.forEach((item, index) => {
    formatted += `${index + 1}. **[${item.title}](${item.url})**\n`;
    if (item.publishedDate) {
      formatted += `   *Published:* ${item.publishedDate}\n`;
    }
    formatted += `   *Snippet:* ${item.content}\n\n`;
  });

  return formatted.trim();
}

/**
 * LangChain Tool definition for Tavily Search (available to chat-space agent only)
 */
export const tavilySearchTool = tool(
  async ({ query, topic = 'news', maxResults = 5, sessionId }) => {
    try {
      const result = await executeTavilySearch(query, {
        topic,
        maxResults,
        sessionId,
      });
      return formatSearchResultsForPrompt(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      return `Search error for query "${query}": ${errorMessage}`;
    }
  },
  {
    name: 'tavily_search',
    description:
      'Search for latest tech news, AI developments, software releases, and verify current-event facts for ideation. Available ONLY during ideation/chat stage.',
    schema: z.object({
      query: z.string().describe('The search query focusing on tech news, AI developments, or fact verification'),
      topic: z.enum(['general', 'news']).default('news').describe('Search domain, defaults to news for current events'),
      maxResults: z.number().default(5).describe('Maximum number of search results to return'),
      sessionId: z.string().optional().describe('Chat session ID for caching results per conversation'),
    }),
  }
);

/**
 * Builds an optimal tech news query based on the user's message
 */
export function buildTechNewsSearchQuery(message: string): string {
  let clean = message.trim();

  // Strip emojis and non-alphanumeric symbols from beginning
  clean = clean.replace(/^[^a-zA-Z0-9"'`]+/, '').trim();

  // Strip conversational filler prefixes
  clean = clean
    .replace(/^(can you |please |could you )?(generate|give me|propose|brainstorm|create|suggest|come up with|find|scan)\s+(\d+\s+)?(post\s+)?(ideas?\s+)?(on|for|about)?/i, '')
    .replace(/^(covering|focusing on)\s+/i, '')
    .trim();

  if (!clean || clean.length < 5) {
    return 'latest breaking tech news AI models developer tools this week';
  }

  const lower = clean.toLowerCase();
  if (!lower.includes('news') && !lower.includes('latest') && !lower.includes('update') && !lower.includes('today')) {
    return `${clean} latest tech news`;
  }

  return clean;
}

/**
 * Heuristic to detect if a user prompt in ideation requires current events or live fact-verification
 */
export function isSearchQueryNeeded(message: string): boolean {
  // Always true for tech news ideation agent unless the user is explicitly just saying thanks or yes/no
  const clean = message.trim().toLowerCase();
  if (['thanks', 'thank you', 'ok', 'okay', 'yes', 'no', 'cool', 'sounds good'].includes(clean)) {
    return false;
  }
  return true;
}
