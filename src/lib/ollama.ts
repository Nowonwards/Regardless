import { Ollama } from 'ollama';

function resolveOllamaHost(): string {
  const envHost = process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL;
  // If undefined or mistakenly set to https://api.ollama.com (which redirects to landing page), default to local daemon
  if (!envHost || envHost.includes('api.ollama.com')) {
    return 'http://127.0.0.1:11434';
  }
  return envHost;
}

export const OLLAMA_HOST = resolveOllamaHost();
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:31b-cloud';
export const OLLAMA_FALLBACK_MODELS = ['gemma4:31b-cloud', 'qwen3.5:9b', 'llama3.2:latest'];

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

export const ollamaClient = new Ollama({
  host: OLLAMA_HOST,
  headers: OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : undefined,
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

export async function generateCompletion(
  messages: OllamaMessage[],
  options: OllamaOptions = {}
): Promise<string> {
  const modelsToTry = [OLLAMA_MODEL, ...OLLAMA_FALLBACK_MODELS.filter((m) => m !== OLLAMA_MODEL)];
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
    } catch (error) {
      console.warn(`Ollama completion failed with model ${model}, trying fallback...`, error);
      lastError = error;
    }
  }

  console.error('All Ollama models failed for completion:', lastError);
  throw new Error(`Failed to generate completion: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`);
}

export async function generateStreamCompletion(
  messages: OllamaMessage[],
  options: OllamaOptions = {},
  onChunk: (chunk: string) => void
): Promise<string> {
  const modelsToTry = [OLLAMA_MODEL, ...OLLAMA_FALLBACK_MODELS.filter((m) => m !== OLLAMA_MODEL)];
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
    } catch (error) {
      console.warn(`Ollama stream failed with model ${model}, trying fallback...`, error);
      lastError = error;
    }
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