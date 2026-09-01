import fs from 'fs';
import path from 'path';
import os from 'os';
import sharp from 'sharp';
import { Composio } from '@composio/core';

/**
 * Composio Platform client — singleton.
 * Reads COMPOSIO_API_KEY from the environment automatically.
 *
 * Credential must be an `ak_*` project key from:
 * dashboard.composio.dev → Platform → your project → Getting Started
 */
export const composioClient = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  baseURL: 'https://backend.composio.dev',
});

/**
 * Toolkit slug mapping per platform.
 * Discovered from Composio — do not invent these.
 */
export const PLATFORM_TOOLKIT_SLUGS: Record<string, string> = {
  INSTAGRAM: 'instagram',
  LINKEDIN: 'linkedin',
  PINTEREST: 'pinterest',
};

export type SupportedPlatform = 'INSTAGRAM' | 'LINKEDIN' | 'PINTEREST';

// ---------------------------------------------------------------------------
// Connection management
// ---------------------------------------------------------------------------

/**
 * Generates a Composio Connect Link for the user to authenticate with
 * a social media platform.
 *
 * Uses session.authorize() — the recommended way to surface Connect Links
 * in your own UI without building an OAuth flow yourself.
 *
 * @param userId  - Stable user identifier from your DB (e.g., user.id)
 * @param platform - One of INSTAGRAM | LINKEDIN | PINTEREST
 * @param callbackUrl - Your app URL to redirect to after auth completes
 * @returns { authUrl } — send the user to this URL
 */
export async function initiatePlatformConnection(
  userId: string,
  platform: SupportedPlatform,
  callbackUrl: string
): Promise<{ authUrl: string; connectedAccountId: string }> {
  const toolkitSlug = PLATFORM_TOOLKIT_SLUGS[platform];

  // Create a session scoped to this user
  const session = await composioClient.create(userId, {
    manageConnections: { callbackUrl },
  });

  // Authorize returns a Connect Link for the specified toolkit
  const connectLink = await session.authorize(toolkitSlug);

  if (!connectLink?.redirectUrl) {
    throw new Error(
      `Composio did not return a Connect Link for ${platform}. ` +
      `Check that the "${toolkitSlug}" toolkit has managed auth enabled in your project.`
    );
  }

  return {
    authUrl: connectLink.redirectUrl,
    connectedAccountId: connectLink.id ?? '',
  };
}

/**
 * Checks the current connection status for a user on a given platform.
 * Uses connectedAccounts.list with toolkit filter — no session required.
 */
export async function getPlatformConnectionStatus(
  userId: string,
  platform: SupportedPlatform
): Promise<{ connected: boolean; connectedAccountId?: string }> {
  try {
    const toolkitSlug = PLATFORM_TOOLKIT_SLUGS[platform];

    const result = await composioClient.connectedAccounts.list({
      userIds: [userId],
      toolkitSlugs: [toolkitSlug],
      statuses: ['ACTIVE'],
      limit: 1,
    });

    if (!result.items || result.items.length === 0) {
      return { connected: false };
    }

    return {
      connected: true,
      connectedAccountId: result.items[0].id,
    };
  } catch (error) {
    console.error(`[Composio] getPlatformConnectionStatus error for ${platform}:`, error);
    return { connected: false };
  }
}

/**
 * Disconnects all active connections for a user on a given platform.
 */
export async function disconnectPlatform(
  userId: string,
  platform: SupportedPlatform
): Promise<void> {
  const toolkitSlug = PLATFORM_TOOLKIT_SLUGS[platform];

  const result = await composioClient.connectedAccounts.list({
    userIds: [userId],
    toolkitSlugs: [toolkitSlug],
    limit: 10,
  });

  if (!result.items || result.items.length === 0) {
    return;
  }

  for (const account of result.items) {
    await composioClient.connectedAccounts.delete(account.id);
  }
}

// ---------------------------------------------------------------------------
// Publishing via sessions
// ---------------------------------------------------------------------------

/**
 * Publishes content to a connected social media platform.
 * Creates a session for the user and executes the appropriate Composio tool.
 *
 * @param userId - Stable user ID
 * @param platform - Target platform
 * @param content - Post content
 */
async function publishInstagramContent(
  session: Awaited<ReturnType<typeof composioClient.create>>,
  content: {
    caption?: string;
    mediaUrls: string[];
    mediaType: 'image' | 'video' | 'carousel';
    hashtags?: string[];
    altText?: string;
  }
): Promise<{ postId: string; url: string }> {
  let fullCaption = content.caption || '';
  if (content.hashtags && content.hashtags.length > 0) {
    const tagString = content.hashtags
      .map((t) => (t.startsWith('#') ? t : `#${t}`))
      .join(' ');
    if (!fullCaption.includes(content.hashtags[0])) {
      fullCaption = `${fullCaption}\n\n${tagString}`.trim();
    }
  }

  const tempFilesToClean: string[] = [];

  try {
    const uploadedFiles: Array<{ name: string; mimetype: string; s3key: string }> = [];

    for (let i = 0; i < content.mediaUrls.length; i++) {
      const mediaUrl = content.mediaUrls[i];
      let rawBuffer: Buffer;

      if (mediaUrl.startsWith('data:image/')) {
        const base64Data = mediaUrl.split(',')[1];
        rawBuffer = Buffer.from(base64Data, 'base64');
      } else {
        const res = await fetch(mediaUrl);
        if (!res.ok) {
          throw new Error(`Failed to download slide image ${i + 1} (${res.status} ${res.statusText})`);
        }
        rawBuffer = Buffer.from(await res.arrayBuffer());
      }

      // Convert any image format (PNG, WebP, etc.) to standard Instagram-compliant JPEG
      const jpegBuffer = await sharp(rawBuffer)
        .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
        .toBuffer();

      const tempPath = path.join(os.tmpdir(), `regardless_slide_${Date.now()}_${i}.jpg`);
      fs.writeFileSync(tempPath, jpegBuffer);
      tempFilesToClean.push(tempPath);

      const uploaded = await composioClient.files.upload({
        file: tempPath,
        toolSlug: 'INSTAGRAM_CREATE_CAROUSEL_CONTAINER',
        toolkitSlug: 'instagram',
      });
      (uploaded as { mimetype?: string }).mimetype = 'image/jpeg';
      uploadedFiles.push(uploaded as { name: string; mimetype: string; s3key: string });
    }

    if (uploadedFiles.length === 0) {
      throw new Error('No valid slide images found to publish to Instagram');
    }

    let containerId: string | number | undefined;

    if (uploadedFiles.length > 1 || content.mediaType === 'carousel') {
      console.log(`[Composio] Creating Instagram carousel container with ${uploadedFiles.length} slides...`);
      const containerRes = await session.execute('INSTAGRAM_CREATE_CAROUSEL_CONTAINER', {
        ig_user_id: 'me',
        caption: fullCaption,
        child_image_files: uploadedFiles,
      });

      if (containerRes.error) {
        throw new Error(containerRes.error || 'Failed to create Instagram carousel container');
      }

      const data = containerRes.data as Record<string, unknown> | undefined;
      containerId = (data?.id || data?.creation_id || (containerRes as unknown as Record<string, unknown>).creation_id) as string | number;
    } else {
      console.log(`[Composio] Creating Instagram single image container...`);
      const containerRes = await session.execute('INSTAGRAM_POST_IG_USER_MEDIA', {
        ig_user_id: 'me',
        caption: fullCaption,
        image_file: uploadedFiles[0],
      });

      if (containerRes.error) {
        throw new Error(containerRes.error || 'Failed to create Instagram media container');
      }

      const data = containerRes.data as Record<string, unknown> | undefined;
      containerId = (data?.id || data?.creation_id || (containerRes as unknown as Record<string, unknown>).creation_id) as string | number;
    }

    if (!containerId) {
      throw new Error('Instagram container created but no container ID returned');
    }

    console.log(`[Composio] Publishing Instagram media container ${containerId}...`);
    const pubRes = await session.execute('INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH', {
      ig_user_id: 'me',
      creation_id: String(containerId),
      max_wait_seconds: 60,
    });

    if (pubRes.error) {
      throw new Error(pubRes.error || 'Failed to publish Instagram media container');
    }

    const pubData = (pubRes.data as Record<string, string>) ?? {};
    const publishedPostId = pubData.id ?? pubData.post_id ?? String(containerId);
    const publishedUrl = pubData.permalink ?? pubData.url ?? pubData.post_url ?? '';

    return {
      postId: publishedPostId,
      url: publishedUrl,
    };
  } finally {
    for (const f of tempFilesToClean) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {}
    }
  }
}

/**
 * Publishes content to a connected social media platform.
 * Creates a session for the user and executes the appropriate Composio tool.
 *
 * @param userId - Stable user ID
 * @param platform - Target platform
 * @param content - Post content
 */
export async function publishToPlatform(
  userId: string,
  platform: SupportedPlatform,
  content: {
    caption?: string;
    mediaUrls: string[];
    mediaType: 'image' | 'video' | 'carousel';
    hashtags?: string[];
    altText?: string;
  }
): Promise<{ postId: string; url: string }> {
  // Create a session for the user
  const session = await composioClient.create(userId);

  if (platform === 'INSTAGRAM') {
    return publishInstagramContent(session, content);
  }

  const toolNameMap: Record<SupportedPlatform, string> = {
    INSTAGRAM: 'INSTAGRAM_CREATE_POST',
    LINKEDIN: 'LINKEDIN_CREATE_POST',
    PINTEREST: 'PINTEREST_CREATE_PIN',
  };

  const toolName = toolNameMap[platform];

  let fullCaption = content.caption || '';
  if (content.hashtags && content.hashtags.length > 0) {
    const tagString = content.hashtags
      .map((t) => (t.startsWith('#') ? t : `#${t}`))
      .join(' ');
    if (!fullCaption.includes(content.hashtags[0])) {
      fullCaption = `${fullCaption}\n\n${tagString}`.trim();
    }
  }

  const payload: Record<string, unknown> = {
    caption: fullCaption,
    media_urls: content.mediaUrls,
    media_type: content.mediaType,
    hashtags: content.hashtags,
    alt_text: content.altText,
    text: fullCaption,
    media: content.mediaUrls,
    mediaUrls: content.mediaUrls,
  };

  console.log(`[Composio] Executing ${toolName} for user ${userId} with ${content.mediaUrls.length} media URLs`);

  const result = await session.execute(toolName, payload);

  if (result.error) {
    console.error(`[Composio] ${toolName} execution error:`, result.error);
    throw new Error(result.error || `Publishing to ${platform} failed`);
  }

  const data = (result.data as Record<string, string>) ?? {};
  return {
    postId: data.post_id ?? data.id ?? data.postId ?? data.pin_id ?? '',
    url: data.post_url ?? data.permalink ?? data.url ?? data.pin_url ?? '',
  };
}

// ---------------------------------------------------------------------------
// Typography slide image generation via Composio Google Gemini
// ---------------------------------------------------------------------------

export interface SlideTypographyData {
  factLine: string;
  takeLine: string;
  slideNumber: number;
  totalSlides: number;
  handle?: string;
}

/**
 * Builds the exact prompt for typography-rendered Instagram carousel slides.
 */
export function formatSlideTypographyPrompt(data: SlideTypographyData): string {
  const handle = data.handle || '@regardless.ai';
  const cleanFact = data.factLine.replace(/[\n\r]+/g, ' ').trim();
  const cleanTake = data.takeLine.replace(/[\n\r]+/g, ' ').trim();

  return `You are generating the actual slide image for the user's Instagram carousel — not a concept photo to be captioned later. The text below MUST be rendered as visible typography inside the image itself. This is a text slide, not an illustration.

DO NOT generate: abstract concept photography, metaphor objects (scales, padlocks, glowing folders, gavels, laptops, office scenes), stock-photo style imagery, or any image where the words are implied rather than shown. If there is no legible text rendered in the image, the output is wrong.

RENDER THIS EXACT TEXT INTO THE IMAGE:
- Headline/fact line: "${cleanFact}"
- Take/insight line: "${cleanTake}"
- Slide counter: "${data.slideNumber}/${data.totalSlides}"
- Handle: "${handle}"

VISUAL STYLE (apply exactly, every slide, no variation)
- Background: flat solid dark color, hex #12141C. No photos, no textures, no gradients, no neon glow.
- Headline text: bold sans-serif, off-white (#F5F4FA), large, sentence case, positioned in the upper-to-middle two-thirds of the frame.
- Take/insight text: regular weight, muted gray (#9C98AE), smaller than the headline, directly below it.
- Accent color #8B7FE8 used only on the single most important word/number in the headline — solid color fill, never glow or outline.
- Short accent-colored divider line between headline and take text.
- Counter badge top-right: pill shape, thin border, small text, format "${data.slideNumber}/${data.totalSlides}".
- Handle bottom-left, small and muted "${handle}".
- Portrait orientation, Instagram carousel aspect ratio (4:5).

TEXT RULES
- Keep the headline to one short sentence — if it's long, it will render illegibly. Do not paraphrase or shorten the provided text; if it's too long for clean rendering, that's a signal to shorten it at the copy stage, not here.
- No decorative or script fonts. Clean, highly legible sans-serif only — has to be readable at thumbnail size on a phone.
- Do not add any text beyond what's specified above (no extra taglines, no watermarks, no made-up captions).`;
}

/**
 * Generates an image for post slides using Composio's Google Gemini image tool.
 *
 * @param promptOrData - Visual description string or structured typography data
 * @param userId - Stable user ID
 * @param aspectRatio - Target aspect ratio: '4:5' | '1:1' | '16:9' | '9:16' | '2:3'
 * @returns Public URL of the generated image or null
 */
export async function generateSlideImage(
  promptOrData: string | SlideTypographyData,
  userId: string = 'default-user',
  aspectRatio: '1:1' | '4:5' | '16:9' | '9:16' | '2:3' = '4:5'
): Promise<string | null> {
  try {
    const finalPrompt = typeof promptOrData === 'string'
      ? promptOrData
      : formatSlideTypographyPrompt(promptOrData);

    const session = await composioClient.create(userId);
    const result = await session.execute('GEMINI_GENERATE_IMAGE', {
      prompt: finalPrompt,
      aspect_ratio: aspectRatio === '4:5' ? '4:5' : aspectRatio,
      model: 'gemini-2.5-flash-image',
    });

    if (result.error) {
      console.warn('[Composio Gemini Image] Execution error:', result.error);
      return null;
    }

    const data = result.data as any;
    const s3url = data?.image?.s3url || data?.image_url || data?.url;
    return s3url || null;
  } catch (error) {
    console.error('[Composio Gemini Image] Failed to generate image:', error);
    return null;
  }
}