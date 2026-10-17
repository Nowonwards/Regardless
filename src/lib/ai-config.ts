import { prisma } from '@/lib/prisma';

export type ReelProvider = 'higgsfield' | 'composio_gemini' | 'local_motion';
export type SlideProvider = 'composio_gemini' | 'higgsfield' | 'og_typography';
export type TextProvider = 'ollama' | 'composio_gemini' | 'auto';

export interface AiRoutingConfig {
  reelProvider: ReelProvider;
  slideProvider: SlideProvider;
  textProvider: TextProvider;
}

export interface ProviderConnectionState {
  connected: boolean;
  hasKey: boolean;
  apiKeyMasked: string | null;
  baseUrl?: string;
  model?: string;
  details?: string;
}

export interface UserAiConfigResponse {
  ollama: ProviderConnectionState;
  higgsfield: ProviderConnectionState;
  composio: ProviderConnectionState;
  routing: AiRoutingConfig;
}

export interface ResolvedAiCredentials {
  ollamaApiKey: string | null;
  ollamaBaseUrl: string;
  ollamaModel: string;
  higgsfieldKey: string | null;
  composioApiKey: string | null;
  routing: AiRoutingConfig;
}

/**
 * Masks an API key for safe display in the frontend UI.
 */
export function maskApiKey(key: string | null | undefined): string | null {
  if (!key || key.length === 0) return null;
  if (key.length <= 8) return '••••••••';
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

function normalizeCloudBaseUrl(url?: string | null): string {
  if (!url || url.includes('127.0.0.1') || url.includes('localhost')) {
    return 'https://api.ollama.com';
  }
  return url;
}

function normalizeCloudModel(model?: string | null): string {
  if (!model || model === 'gemma4:31b-cloud') {
    return 'gemma4:31b';
  }
  return model;
}

/**
 * Retrieves the raw decrypted/plain AI configuration and credentials.
 */
export async function getResolvedAiCredentials(
  userId?: string
): Promise<ResolvedAiCredentials> {
  const envOllamaKey = process.env.OLLAMA_API_KEY || null;
  const envOllamaBase = normalizeCloudBaseUrl(process.env.OLLAMA_BASE_URL);
  const envOllamaModel = normalizeCloudModel(process.env.OLLAMA_MODEL);
  const envHfCreds = process.env.HF_CREDENTIALS || null;
  const envComposioKey = process.env.COMPOSIO_API_KEY || null;

  if (!userId) {
    return {
      ollamaApiKey: envOllamaKey,
      ollamaBaseUrl: envOllamaBase,
      ollamaModel: envOllamaModel,
      higgsfieldKey: envHfCreds,
      composioApiKey: envComposioKey,
      routing: {
        reelProvider: envHfCreds ? 'higgsfield' : 'composio_gemini',
        slideProvider: envComposioKey ? 'composio_gemini' : 'higgsfield',
        textProvider: envOllamaKey ? 'ollama' : 'composio_gemini',
      },
    };
  }

  try {
    const dbSetting = await prisma.userAiSetting.findUnique({
      where: { userId },
    });

    // For authenticated users, credentials must be isolated to their own account.
    // We do NOT fall back to server admin .env keys for user connection status.
    const ollamaApiKey = dbSetting?.ollamaApiKey?.trim() || null;
    const ollamaBaseUrl = normalizeCloudBaseUrl(dbSetting?.ollamaBaseUrl);
    const ollamaModel = normalizeCloudModel(dbSetting?.ollamaModel);
    const higgsfieldKey = dbSetting?.higgsfieldKey?.trim() || null;
    const composioApiKey = dbSetting?.composioApiKey?.trim() || null;

    const reelProvider = (dbSetting?.reelProvider as ReelProvider) ||
      (higgsfieldKey ? 'higgsfield' : 'composio_gemini');
    const slideProvider = (dbSetting?.slideProvider as SlideProvider) ||
      (composioApiKey ? 'composio_gemini' : 'higgsfield');
    const textProvider = (dbSetting?.textProvider as TextProvider) ||
      (ollamaApiKey ? 'ollama' : 'composio_gemini');

    return {
      ollamaApiKey,
      ollamaBaseUrl,
      ollamaModel,
      higgsfieldKey,
      composioApiKey,
      routing: {
        reelProvider,
        slideProvider,
        textProvider,
      },
    };
  } catch (error) {
    console.error('[getResolvedAiCredentials] Error reading settings from DB:', error);
    return {
      ollamaApiKey: null,
      ollamaBaseUrl: normalizeCloudBaseUrl(null),
      ollamaModel: normalizeCloudModel(null),
      higgsfieldKey: null,
      composioApiKey: null,
      routing: {
        reelProvider: 'higgsfield',
        slideProvider: 'composio_gemini',
        textProvider: 'ollama',
      },
    };
  }
}

/**
 * Formats user AI configuration for client responses with masked keys.
 */
export async function getUserAiConfig(userId: string): Promise<UserAiConfigResponse> {
  const resolved = await getResolvedAiCredentials(userId);

  return {
    ollama: {
      connected: Boolean(resolved.ollamaApiKey),
      hasKey: Boolean(resolved.ollamaApiKey),
      apiKeyMasked: maskApiKey(resolved.ollamaApiKey),
      baseUrl: resolved.ollamaBaseUrl,
      model: resolved.ollamaModel,
    },
    higgsfield: {
      connected: Boolean(resolved.higgsfieldKey),
      hasKey: Boolean(resolved.higgsfieldKey),
      apiKeyMasked: maskApiKey(resolved.higgsfieldKey),
      model: 'bytedance/seedance-2.5/text-to-video',
    },
    composio: {
      connected: Boolean(resolved.composioApiKey),
      hasKey: Boolean(resolved.composioApiKey),
      apiKeyMasked: maskApiKey(resolved.composioApiKey),
      model: 'gemini-2.5-flash',
    },
    routing: resolved.routing,
  };
}

/**
 * Disconnects an AI provider for a user, clearing the stored API key in the database.
 */
export async function disconnectAiProvider(
  userId: string,
  provider: 'ollama' | 'higgsfield' | 'composio'
): Promise<UserAiConfigResponse> {
  const updateData: {
    ollamaApiKey?: string | null;
    higgsfieldKey?: string | null;
    composioApiKey?: string | null;
  } = {};

  if (provider === 'ollama') updateData.ollamaApiKey = null;
  if (provider === 'higgsfield') updateData.higgsfieldKey = null;
  if (provider === 'composio') updateData.composioApiKey = null;

  const existing = await prisma.userAiSetting.findUnique({
    where: { userId },
  });

  if (existing) {
    await prisma.userAiSetting.update({
      where: { userId },
      data: updateData,
    });
  }

  return getUserAiConfig(userId);
}

/**
 * Saves user AI configuration and routing choices to the database.
 */
export async function saveUserAiConfig(
  userId: string,
  payload: {
    ollamaApiKey?: string | null;
    ollamaBaseUrl?: string;
    ollamaModel?: string;
    higgsfieldKey?: string | null;
    composioApiKey?: string | null;
    reelProvider?: ReelProvider;
    slideProvider?: SlideProvider;
    textProvider?: TextProvider;
    disconnect?: 'ollama' | 'higgsfield' | 'composio';
  }
): Promise<UserAiConfigResponse> {
  if (payload.disconnect) {
    return disconnectAiProvider(userId, payload.disconnect);
  }

  const existing = await prisma.userAiSetting.findUnique({
    where: { userId },
  });

  const shouldUpdateKey = (
    newKey: string | null | undefined,
    currentKey: string | null | undefined
  ) => {
    if (newKey === undefined) return currentKey;
    if (newKey === null || newKey === '') return null;
    if (newKey.includes('••••')) return currentKey;
    const trimmed = newKey.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const ollamaApiKey = shouldUpdateKey(payload.ollamaApiKey, existing?.ollamaApiKey);
  const higgsfieldKey = shouldUpdateKey(payload.higgsfieldKey, existing?.higgsfieldKey);
  const composioApiKey = shouldUpdateKey(payload.composioApiKey, existing?.composioApiKey);

  await prisma.userAiSetting.upsert({
    where: { userId },
    create: {
      userId,
      ollamaApiKey,
      ollamaBaseUrl: payload.ollamaBaseUrl?.trim() || 'https://api.ollama.com',
      ollamaModel: payload.ollamaModel?.trim() || 'gemma4:31b',
      higgsfieldKey,
      composioApiKey,
      reelProvider: payload.reelProvider || 'higgsfield',
      slideProvider: payload.slideProvider || 'composio_gemini',
      textProvider: payload.textProvider || 'ollama',
    },
    update: {
      ollamaApiKey,
      ollamaBaseUrl: payload.ollamaBaseUrl !== undefined
        ? payload.ollamaBaseUrl.trim()
        : existing?.ollamaBaseUrl,
      ollamaModel: payload.ollamaModel !== undefined
        ? payload.ollamaModel.trim()
        : existing?.ollamaModel,
      higgsfieldKey,
      composioApiKey,
      reelProvider: payload.reelProvider || existing?.reelProvider,
      slideProvider: payload.slideProvider || existing?.slideProvider,
      textProvider: payload.textProvider || existing?.textProvider,
    },
  });

  return getUserAiConfig(userId);
}
