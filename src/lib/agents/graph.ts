import { StateGraph, Annotation } from '@langchain/langgraph';
import { generateCompletion, generateStreamCompletion, OllamaMessage } from '../ollama';
import { createIdeationPrompt, createDraftGenerationPrompt, createRevisionPrompt } from './prompts';
import {
  executeTavilySearch,
  formatSearchResultsForPrompt,
  isSearchQueryNeeded,
} from './tools/tavily-search';
import { Platform, PostContent, IdeaContent } from '@/types';

export interface AgentState {
  messages: OllamaMessage[];
  userId: string;
  sessionId: string;
  platforms: Platform[];
  dateRange?: { start: Date; end: Date };
  ideas: IdeaContent[];
  selectedIdeas: string[];
  currentDraft: PostContent | null;
  revisionFeedback: string;
  stage: 'ideation' | 'selection' | 'drafting' | 'revision' | 'complete';
  error?: string;
}

export const StateAnnotation = Annotation.Root({
  messages: Annotation<OllamaMessage[]>({
    reducer: (_, action) => action,
    default: () => [],
  }),
  userId: Annotation<string>(),
  sessionId: Annotation<string>(),
  platforms: Annotation<Platform[]>({
    reducer: (a, b) => b,
    default: () => [],
  }),
  dateRange: Annotation<{ start: Date; end: Date } | undefined>({
    reducer: (a, b) => b,
    default: () => undefined,
  }),
  ideas: Annotation<IdeaContent[]>({
    reducer: (a, b) => b,
    default: () => [],
  }),
  selectedIdeas: Annotation<string[]>({
    reducer: (a, b) => b,
    default: () => [],
  }),
  currentDraft: Annotation<PostContent | null>({
    reducer: (a, b) => b,
    default: () => null,
  }),
  revisionFeedback: Annotation<string>({
    reducer: (a, b) => b,
    default: () => '',
  }),
  stage: Annotation<'ideation' | 'selection' | 'drafting' | 'revision' | 'complete'>({
    reducer: (a, b) => b,
    default: () => 'ideation',
  }),
  error: Annotation<string | undefined>({
    reducer: (a, b) => b,
    default: () => undefined,
  }),
});

async function ideationNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const { messages, platforms, dateRange, sessionId } = state;
  const lastUserMessage = messages[messages.length - 1]?.content || '';

  let searchResultsText: string | undefined = undefined;
  if (process.env.TAVILY_API_KEY && isSearchQueryNeeded(lastUserMessage)) {
    try {
      const searchResult = await executeTavilySearch(lastUserMessage, {
        sessionId,
        topic: 'news',
        maxResults: 5,
      });
      if (searchResult.results && searchResult.results.length > 0) {
        searchResultsText = formatSearchResultsForPrompt(searchResult);
      }
    } catch (searchError) {
      console.warn('Tavily search error in ideation node (continuing without search):', searchError);
    }
  }

  const prompt = createIdeationPrompt(
    lastUserMessage,
    messages.slice(0, -1),
    platforms,
    dateRange,
    searchResultsText
  );

  try {
    const response = await generateCompletion(prompt);

    const newMessages = [...messages, { role: 'assistant' as const, content: response }];

    return {
      messages: newMessages,
      stage: 'selection',
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Ideation failed',
      stage: 'ideation',
    };
  }
}

async function draftGenerationNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const { selectedIdeas, platforms, ideas } = state;

  if (selectedIdeas.length === 0) {
    return { error: 'No ideas selected', stage: 'selection' };
  }

  const selectedIdea = ideas.find((i) => selectedIdeas.includes(i.title));
  if (!selectedIdea) {
    return { error: 'Selected idea not found', stage: 'selection' };
  }

  const platform = selectedIdea.platform || platforms[0];
  const prompt = createDraftGenerationPrompt(
    {
      title: selectedIdea.title,
      description: selectedIdea.description,
      content: {
        hook: selectedIdea.hook,
        angle: selectedIdea.angle,
        keyPoints: selectedIdea.keyPoints,
        suggestedFormat: selectedIdea.suggestedFormat,
        hashtags: selectedIdea.hashtags,
        cta: selectedIdea.cta,
      },
      platform,
    },
    platform
  );

  try {
    const response = await generateCompletion(prompt);
    const draftContent = JSON.parse(response) as PostContent;

    return {
      currentDraft: draftContent,
      stage: 'revision',
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Draft generation failed',
      stage: 'drafting',
    };
  }
}

async function revisionNode(state: typeof StateAnnotation.State): Promise<Partial<typeof StateAnnotation.State>> {
  const { currentDraft, revisionFeedback, platforms } = state;

  if (!currentDraft || !revisionFeedback) {
    return { error: 'Missing draft or feedback', stage: 'revision' };
  }

  const platform = platforms[0];
  const prompt = createRevisionPrompt(currentDraft as unknown as Record<string, unknown>, revisionFeedback, platform);

  try {
    const response = await generateCompletion(prompt);
    const revisedContent = JSON.parse(response) as PostContent;

    return {
      currentDraft: revisedContent,
      revisionFeedback: '',
      stage: 'revision',
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Revision failed',
      stage: 'revision',
    };
  }
}

export const agentGraph = new StateGraph(StateAnnotation)
  .addNode('ideation', ideationNode)
  .addNode('draftGeneration', draftGenerationNode)
  .addNode('revision', revisionNode)
  .addEdge('__start__', 'ideation')
  .addConditionalEdges('ideation', (state: typeof StateAnnotation.State) => {
    if (state.error) return 'ideation';
    return 'draftGeneration';
  })
  .addConditionalEdges('draftGeneration', (state: typeof StateAnnotation.State) => {
    if (state.error) return 'draftGeneration';
    return 'revision';
  })
  .addConditionalEdges('revision', (state: typeof StateAnnotation.State) => {
    if (state.error) return 'revision';
    return '__end__';
  });

export const compiledGraph = agentGraph.compile();