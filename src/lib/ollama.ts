import ollama from 'ollama';

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:31b';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://api.ollama.com';
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

// Configure ollama with custom host
const ollamaConfig = {
  host: OLLAMA_BASE_URL,
  headers: OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : undefined,
};

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
  try {
    const response = await ollama.chat({
      model: OLLAMA_MODEL,
      messages,
      options: {
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 0.9,
        top_k: options.top_k ?? 40,
        num_predict: options.num_predict ?? 2048,
        stop: options.stop,
      },
      ...ollamaConfig,
    });
    return response.message.content;
  } catch (error) {
    console.error('Ollama generation error:', error);
    throw new Error(`Failed to generate completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateStreamCompletion(
  messages: OllamaMessage[],
  options: OllamaOptions = {},
  onChunk: (chunk: string) => void
): Promise<string> {
  try {
    let fullContent = '';
    const stream = await ollama.chat({
      model: OLLAMA_MODEL,
      messages,
      options: {
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 0.9,
        top_k: options.top_k ?? 40,
        num_predict: options.num_predict ?? 2048,
        stop: options.stop,
      },
      ...ollamaConfig,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.message.content;
      fullContent += content;
      onChunk(content);
    }

    return fullContent;
  } catch (error) {
    console.error('Ollama stream generation error:', error);
    throw new Error(`Failed to generate stream completion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function createSystemPrompt(role: string, instructions: string[]): OllamaMessage {
  return {
    role: 'system',
    content: `You are ${role}.\n\nInstructions:\n${instructions.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`,
  };
}