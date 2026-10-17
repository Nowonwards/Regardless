import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { config, higgsfield } from '@higgsfield/client/v2';

// Ensure .env.local is loaded securely without logging credentials
dotenv.config({ path: '.env.local' });

if (process.env.HF_CREDENTIALS) {
  try {
    config({ credentials: process.env.HF_CREDENTIALS });
  } catch (err) {
    console.error('[Higgsfield] Init config warning:', err);
  }
}

export interface HiggsfieldVideoRequest {
  prompt: string;
  duration?: number;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  resolution?: '720p' | '1080p';
  model?: string;
  credentials?: string;
}

export interface HiggsfieldVideoResult {
  success: boolean;
  videoUrl?: string;
  requestId?: string;
  error?: string;
}

export interface HiggsfieldImageRequest {
  prompt: string;
  aspectRatio?: '4:5' | '1:1' | '16:9' | '9:16';
  quality?: '720p' | '1080p';
  model?: string;
  credentials?: string;
}

export interface HiggsfieldImageResult {
  success: boolean;
  imageUrl?: string;
  requestId?: string;
  error?: string;
}

/**
 * Validates and configures Higgsfield credentials for a call.
 */
function applyHiggsfieldCredentials(customCredentials?: string): string | null {
  const creds = customCredentials || process.env.HF_CREDENTIALS;
  if (creds) {
    try {
      config({ credentials: creds });
      return creds;
    } catch (e) {
      console.warn('[Higgsfield] Credentials config warning:', e);
    }
  }
  return creds || null;
}

/**
 * Generates a cinematic video clip via Higgsfield AI API.
 * Uses official @higgsfield/client subscribe method.
 */
export async function generateHiggsfieldVideo(
  options: HiggsfieldVideoRequest
): Promise<HiggsfieldVideoResult> {
  const creds = applyHiggsfieldCredentials(options.credentials);
  if (!creds) {
    return {
      success: false,
      error: 'Higgsfield credentials are not configured.',
    };
  }

  const model = options.model || 'bytedance/seedance-2.5/text-to-video';
  const duration = options.duration || 5;
  const resolution = options.resolution || '720p';
  const aspectRatio = options.aspectRatio || '9:16';

  try {
    const result = await higgsfield.subscribe(model, {
      input: {
        prompt: options.prompt,
        duration,
        resolution,
        aspect_ratio: aspectRatio,
      },
      withPolling: true,
    });

    if (result.status === 'completed') {
      const url =
        result.video?.url ||
        (result as any).videos?.[0]?.url ||
        (result as any).output?.video_url;

      if (url) {
        return {
          success: true,
          videoUrl: url,
          requestId: result.request_id,
        };
      }
      return {
        success: false,
        requestId: result.request_id,
        error: 'Generation completed but video URL was not present in response',
      };
    }

    if (result.status === 'nsfw') {
      return {
        success: false,
        requestId: result.request_id,
        error: 'Generation flagged by safety moderation filters (NSFW)',
      };
    }

    return {
      success: false,
      requestId: result.request_id,
      error: `Generation ended with status: ${result.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to generate video with Higgsfield AI',
    };
  }
}

/**
 * Generates an image via Higgsfield Soul Text-to-Image for post slides.
 */
export async function generateHiggsfieldImage(
  options: HiggsfieldImageRequest
): Promise<HiggsfieldImageResult> {
  const creds = applyHiggsfieldCredentials(options.credentials);
  if (!creds) {
    return {
      success: false,
      error: 'Higgsfield credentials are not configured.',
    };
  }

  const dimMap: Record<string, string> = {
    '4:5': '1080x1350',
    '1:1': '1080x1080',
    '9:16': '1080x1920',
    '16:9': '1920x1080',
  };
  const widthAndHeight = dimMap[options.aspectRatio || '4:5'] || '1080x1350';

  try {
    const endpoint = (options.model || '/v1/text2image/soul') as any;
    const result = await higgsfield.subscribe(endpoint, {
      input: {
        prompt: options.prompt,
        width_and_height: widthAndHeight,
        quality: options.quality || '1080p',
        batch_size: 1,
      },
      withPolling: true,
    });

    if (result.status === 'completed') {
      const url =
        result.images?.[0]?.url ||
        (result as any).output?.image_url ||
        (result as any).image?.url;

      if (url) {
        return {
          success: true,
          imageUrl: url,
          requestId: result.request_id,
        };
      }
      return {
        success: false,
        requestId: result.request_id,
        error: 'Generation completed but image URL was missing',
      };
    }

    if (result.status === 'nsfw') {
      return {
        success: false,
        requestId: result.request_id,
        error: 'Prompt or image flagged by safety filters (NSFW)',
      };
    }

    return {
      success: false,
      requestId: result.request_id,
      error: `Higgsfield status: ${result.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to generate image with Higgsfield AI',
    };
  }
}

/**
 * Downloads a video from remote URL and saves it locally into public/reels/
 */
async function storeVideoLocally(
  remoteUrl: string,
  fileName: string
): Promise<{ videoUrl: string; localFilePath: string } | null> {
  try {
    const dir = path.join(process.cwd(), 'public', 'reels');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const localFilePath = path.join(dir, fileName);
    const res = await fetch(remoteUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching video from ${remoteUrl}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.promises.writeFile(localFilePath, buffer);
    return {
      videoUrl: `/reels/${fileName}`,
      localFilePath: `public/reels/${fileName}`,
    };
  } catch (err) {
    console.error('[Higgsfield Video] Download error:', err);
    return null;
  }
}

/**
 * High-level helper to generate a Reel using Higgsfield AI and save it locally.
 * Falls back to local motion Reel generator if Higgsfield is unavailable or errors.
 */
export async function generateReelWithHiggsfield(
  postId: string,
  title: string,
  keyPoints: string[] = [],
  customCredentials?: string,
  reelData?: any
): Promise<{
  videoUrl: string;
  localFilePath: string;
  posterUrl: string;
  durationSeconds: number;
  scenes?: any[];
}> {
  const videoFileName = `reel-hf-${postId}.mp4`;
  const posterFileName = `poster-${postId}.png`;
  const videoPrompt = `Cinematic 9:16 high-tech motion visual for: "${title}". Key points: ${keyPoints.slice(0, 3).join(', ')}. Clean sharp cyberpunk developer aesthetic, ultra high definition.`;

  try {
    const hfResult = await generateHiggsfieldVideo({
      prompt: videoPrompt,
      duration: 5,
      aspectRatio: '9:16',
      resolution: '720p',
      credentials: customCredentials,
    });

    if (hfResult.success && hfResult.videoUrl) {
      const localResult = await storeVideoLocally(hfResult.videoUrl, videoFileName);
      if (localResult) {
        return {
          videoUrl: localResult.videoUrl,
          localFilePath: localResult.localFilePath,
          posterUrl: `/reels/${posterFileName}`,
          durationSeconds: 5,
          scenes: reelData?.scenes || [],
        };
      }
    }
  } catch (err) {
    console.warn('[Higgsfield Reel] Generation failed, falling back to local motion generator:', err);
  }

  // Fallback to local reel generator
  const { generateLocalReelVideo } = await import('./reel-generator');
  return generateLocalReelVideo(postId, reelData, title, keyPoints);
}

/**
 * Generates slide image with Higgsfield AI for a carousel slide.
 */
export async function generateHiggsfieldSlideImage(
  data: { factLine: string; takeLine: string; slideNumber: number; totalSlides: number },
  credentials?: string
): Promise<string | null> {
  const prompt = `Modern editorial technology visual for social media slide: "${data.factLine}". Key context: "${data.takeLine}". Dark background, clean cinematic visual, 8k resolution.`;
  const result = await generateHiggsfieldImage({
    prompt,
    aspectRatio: '4:5',
    credentials,
  });

  return result.success && result.imageUrl ? result.imageUrl : null;
}
