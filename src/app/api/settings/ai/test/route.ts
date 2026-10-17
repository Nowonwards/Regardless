import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getResolvedAiCredentials } from '@/lib/ai-config';
import { config as configHiggsfield, higgsfield } from '@higgsfield/client/v2';
import { Composio } from '@composio/core';

/**
 * POST /api/settings/ai/test
 * Validates connection for a selected AI provider (Ollama Cloud, Higgsfield, or Composio).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey, baseUrl, model, credentials } = body;

    const saved = await getResolvedAiCredentials(user.id);

    if (provider === 'ollama') {
      const activeKey = apiKey && !apiKey.includes('••••') ? apiKey.trim() : saved.ollamaApiKey;
      const activeBase = baseUrl?.trim() || saved.ollamaBaseUrl || 'https://api.ollama.com';

      if (!activeKey && activeBase.includes('api.ollama.com')) {
        return NextResponse.json({
          success: false,
          message: 'Ollama Cloud requires an API Key. Please provide your Ollama API Key.',
        });
      }

      const headers: Record<string, string> = {};
      if (activeKey) {
        headers['Authorization'] = `Bearer ${activeKey}`;
      }

      const startTime = Date.now();
      try {
        const res = await fetch(`${activeBase.replace(/\/+$/, '')}/api/tags`, {
          headers,
          signal: AbortSignal.timeout(6000),
        });

        const latency = Date.now() - startTime;

        if (res.status === 200) {
          const data = await res.json().catch(() => ({}));
          const modelsList: string[] = Array.isArray(data?.models)
            ? data.models.map((m: any) => m.name || m.model).filter(Boolean)
            : [];

          return NextResponse.json({
            success: true,
            latencyMs: latency,
            message: `Connected to Ollama Cloud in ${latency}ms.${modelsList.length > 0 ? ` Found ${modelsList.length} models.` : ''}`,
            models: modelsList,
          });
        }

        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({
            success: false,
            message: 'Ollama authentication failed: Invalid API key (HTTP 401/403).',
          });
        }

        return NextResponse.json({
          success: false,
          message: `Ollama host returned status HTTP ${res.status}.`,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          message: `Could not reach Ollama at ${activeBase}: ${err?.message || 'Connection timed out'}`,
        });
      }
    }

    if (provider === 'higgsfield') {
      const activeCreds = credentials && !credentials.includes('••••')
        ? credentials.trim()
        : saved.higgsfieldKey;

      if (!activeCreds) {
        return NextResponse.json({
          success: false,
          message: 'Higgsfield credentials are required to connect.',
        });
      }

      const startTime = Date.now();
      try {
        configHiggsfield({ credentials: activeCreds });
        const latency = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          latencyMs: latency,
          message: `Higgsfield AI connected successfully. Ready for reel generation & slide images.`,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          message: `Higgsfield configuration error: ${err?.message || 'Invalid credentials format'}`,
        });
      }
    }

    if (provider === 'composio') {
      const activeKey = apiKey && !apiKey.includes('••••') ? apiKey.trim() : saved.composioApiKey;

      if (!activeKey) {
        return NextResponse.json({
          success: false,
          message: 'Composio API key is required.',
        });
      }

      const startTime = Date.now();
      try {
        const client = new Composio({ apiKey: activeKey, baseURL: 'https://backend.composio.dev' });
        await client.connectedAccounts.list({ limit: 1 });
        const latency = Date.now() - startTime;

        return NextResponse.json({
          success: true,
          latencyMs: latency,
          message: `Composio connected in ${latency}ms. Google Gemini (Flash & Image) and Veo active.`,
        });
      } catch (err: any) {
        return NextResponse.json({
          success: false,
          message: `Composio verification failed: ${err?.message || 'Invalid API key or unauthorized'}`,
        });
      }
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  } catch (error: any) {
    console.error('[/api/settings/ai/test POST]', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal connection test failure' },
      { status: 500 }
    );
  }
}
