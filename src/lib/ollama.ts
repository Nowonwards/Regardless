import { Ollama } from 'ollama';

function resolveOllamaHost(): string {
  const envHost = process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL;
  if (!envHost || envHost.includes('[SENSITIVE]')) {
    return 'http://127.0.0.1:11434';
  }
  try {
    const trimmed = envHost.replace(/\/+$/, '');
    new URL(trimmed);
    return trimmed;
  } catch {
    return 'http://127.0.0.1:11434';
  }
}

export const OLLAMA_HOST = resolveOllamaHost();
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:31b';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

let _ollamaClient: Ollama | null = null;

export function getOllamaClient(): Ollama {
  if (!_ollamaClient) {
    const host = resolveOllamaHost();
    const apiKey = process.env.OLLAMA_API_KEY;
    _ollamaClient = new Ollama({
      host,
      headers: apiKey && !apiKey.includes('[SENSITIVE]')
        ? { Authorization: `Bearer ${apiKey}` }
        : undefined,
    });
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
}

export async function ensureOllamaRunning(): Promise<boolean> {
  const host = OLLAMA_HOST;
  try {
    const headers: Record<string, string> = {};
    if (OLLAMA_API_KEY) {
      headers['Authorization'] = `Bearer ${OLLAMA_API_KEY}`;
    }
    const res = await fetch(`${host}/api/tags`, { headers, signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

function getCandidateModels(): string[] {
  const primary = OLLAMA_MODEL;
  const candidates: string[] = [primary];

  // If primary has ':cloud' or '-cloud', also add the base name (and vice versa)
  if (primary.includes('-cloud')) {
    candidates.push(primary.replace('-cloud', ''));
  } else if (primary.includes(':cloud')) {
    candidates.push(primary.replace(':cloud', ''));
  } else {
    candidates.push(`${primary}-cloud`);
  }

  // Only fall back to local models if host is local
  const isLocal = OLLAMA_HOST.includes('127.0.0.1') || OLLAMA_HOST.includes('localhost');
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
  const isAvailable = await ensureOllamaRunning();
  if (!isAvailable) {
    const isLocal = OLLAMA_HOST.includes('127.0.0.1') || OLLAMA_HOST.includes('localhost');
    throw new Error(
      `Ollama is not reachable at ${OLLAMA_HOST}. Provide an OLLAMA_API_KEY or remote OLLAMA_HOST, or use Composio Gemini.`
    );
  }

  const modelsToTry = getCandidateModels();
  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      const response = await ollamaClient.chat({
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
      `Cannot reach Ollama at ${OLLAMA_HOST}. Please verify your OLLAMA_API_KEY or OLLAMA_HOST.`
    );
  }

  console.error('All Ollama models failed for completion:', lastError);
  throw new Error(`Failed to generate completion: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`);
}

export async function generateStreamCompletion(
  messages: OllamaMessage[],
  options: OllamaOptions = {},
  onChunk: (chunk: string) => void
): Promise<string> {
  const isAvailable = await ensureOllamaRunning();
  if (!isAvailable) {
    throw new Error(
      `Ollama is not reachable at ${OLLAMA_HOST}. Provide an OLLAMA_API_KEY or remote OLLAMA_HOST, or use Composio Gemini.`
    );
  }

  const modelsToTry = getCandidateModels();
  let lastError: unknown;

  for (const model of modelsToTry) {
    try {
      let fullContent = '';
      const stream = await ollamaClient.chat({
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
      `Cannot reach Ollama at ${OLLAMA_HOST}. Please verify your OLLAMA_API_KEY or OLLAMA_HOST.`
    );
  }

  console.error('All Ollama models failed for stream generation:', lastError);
  throw new Error(`Failed to generate stream completion: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`);
}

export function createSystemPrompt(role: string, instructions: string[]): OllamaMessage {
  return {
    role: 'system',
    content: `You are ${role}.\n\nInstructions:\n${instructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`,
  };
}