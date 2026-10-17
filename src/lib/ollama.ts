import { Ollama } from 'ollama';

export function resolveOllamaHost(customHost?: string): string {
  const envHost = customHost || process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL;
  if (!envHost || envHost.includes('[SENSITIVE]') || envHost.includes('127.0.0.1') || envHost.includes('localhost')) {
    return 'https://api.ollama.com';
  }
  try {
    const trimmed = envHost.replace(/\/+$/, '');
    new URL(trimmed);
    return trimmed;
  } catch {
    return 'https://api.ollama.com';
  }
}

export const OLLAMA_HOST = resolveOllamaHost();
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:31b';

let _ollamaClient: Ollama | null = null;

export function createOllamaClient(customHost?: string, customApiKey?: string): Ollama {
  const host = resolveOllamaHost(customHost);
  const apiKey = customApiKey !== undefined ? customApiKey : process.env.OLLAMA_API_KEY;

  return new Ollama({
    host,
    headers: apiKey && !apiKey.includes('[SENSITIVE]')
      ? { Authorization: `Bearer ${apiKey}` }
      : undefined,
  });
}

export function getOllamaClient(): Ollama {
  if (!_ollamaClient) {
    _ollamaClient = createOllamaClient();
  }
  return _ollamaClient;
}

export const ollamaClient = new Proxy({} as Ollama, {
  get(_target, prop) {
    const client = getOllamaClient();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaOptions {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  num_predict?: number;
  stop?: string[];
  apiKey?: string;
  host?: string;
  model?: string;
}

export async function ensureOllamaRunning(
  customHost?: string,
  customApiKey?: string
): Promise<boolean> {
  const host = resolveOllamaHost(customHost);
  const apiKey = customApiKey !== undefined ? customApiKey : process.env.OLLAMA_API_KEY;

  try {
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    const res = await fetch(`${host}/api/tags`, {
      headers,
      signal: AbortSignal.timeout(3500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function getCandidateModels(primaryModel?: string, activeHost?: string): string[] {
  const primary = primaryModel || OLLAMA_MODEL;
  const candidates: string[] = [primary];

  if (primary.includes('-cloud')) {
    candidates.push(primary.replace('-cloud', ''));
  } else if (primary.includes(':cloud')) {
    candidates.push(primary.replace(':cloud', ''));
  } else {
    candidates.push(`${primary}-cloud`);
  }

  const host = activeHost || OLLAMA_HOST;
  const isLocal = host.includes('127.0.0.1') || host.includes('localhost');
  if (isLocal) {
    for (const m of ['qwen3.5:9b', 'llama3.2:latest']) {
      if (!candidates.includes(m)) candidates.push(m);
    }
  }

  return candidates;
}

export async function generateCompletion(
  messages: OllamaMessage[],
  options: OllamaOptions = {}
): Promise<string> {
  const activeHost = resolveOllamaHost(options.host);
  const client = (options.host || options.apiKey)
    ? createOllamaClient(options.host, options.apiKey)
    : ollamaClient;

  const isAvailable = await ensureOllamaRunning(options.host, options.apiKey);
  if (!isAvailable) {
    throw new Error(
      `Ollama is not reachable at ${activeHost}. Provide an OLLAMA_API_KEY or remote OLLAMA_HOST, or use Composio Gemini.`
    );
  }

  const modelsToTry = getCandidateModels(options.model, activeHost);
  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      const response = await client.chat({
        model,
        messages,
        options: {
          temperature: options.temperature ?? 0.7,
          top_p: options.top_p ?? 0.9,
          top_k: options.top_k ?? 40,
          num_predict: options.num_predict ?? 2048,
          stop: options.stop,
        },
      });
      return response.message.content;
    } catch (error: any) {
      console.warn(`Ollama completion failed with model ${model}, trying fallback...`, error);
      lastError = error;
      if (error?.code === 'ECONNREFUSED' || error?.cause?.code === 'ECONNREFUSED') {
        break;
      }
    }
  }

  const isConnRefused =
    (lastError as any)?.code === 'ECONNREFUSED' ||
    (lastError as any)?.cause?.code === 'ECONNREFUSED';

  if (isConnRefused) {
    throw new Error(
      `Cannot reach Ollama at ${activeHost}. Please verify your OLLAMA_API_KEY or OLLAMA_HOST.`
    );
  }

  console.error('All Ollama models failed for completion:', lastError);
  throw new Error(
    `Failed to generate completion: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`
  );
}

export async function generateStreamCompletion(
  messages: OllamaMessage[],
  options: OllamaOptions = {},
  onChunk: (chunk: string) => void
): Promise<string> {
  const activeHost = resolveOllamaHost(options.host);
  const client = (options.host || options.apiKey)
    ? createOllamaClient(options.host, options.apiKey)
    : ollamaClient;

  const isAvailable = await ensureOllamaRunning(options.host, options.apiKey);
  if (!isAvailable) {
    throw new Error(
      `Ollama is not reachable at ${activeHost}. Provide an OLLAMA_API_KEY or remote OLLAMA_HOST, or use Composio Gemini.`
    );
  }

  const modelsToTry = getCandidateModels(options.model, activeHost);
  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      let fullContent = '';
      const stream = await client.chat({
        model,
        messages,
        options: {
          temperature: options.temperature ?? 0.7,
          top_p: options.top_p ?? 0.9,
          top_k: options.top_k ?? 40,
          num_predict: options.num_predict ?? 2048,
          stop: options.stop,
        },
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.message.content;
        fullContent += content;
        onChunk(content);
      }

      return fullContent;
    } catch (error: any) {
      console.warn(`Ollama stream failed with model ${model}, trying fallback...`, error);
      lastError = error;
      if (error?.code === 'ECONNREFUSED' || error?.cause?.code === 'ECONNREFUSED') {
        break;
      }
    }
  }

  const isConnRefused =
    (lastError as any)?.code === 'ECONNREFUSED' ||
    (lastError as any)?.cause?.code === 'ECONNREFUSED';

  if (isConnRefused) {
    throw new Error(
      `Cannot reach Ollama at ${activeHost}. Please verify your OLLAMA_API_KEY or OLLAMA_HOST.`
    );
  }

  console.error('All Ollama models failed for stream generation:', lastError);
  throw new Error(
    `Failed to generate stream completion: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`
  );
}

export function createSystemPrompt(role: string, instructions: string[]): OllamaMessage {
  return {
    role: 'system',
    content: `You are ${role}.\n\nInstructions:\n${instructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`,
  };
}