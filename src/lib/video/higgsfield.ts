import dotenv from 'dotenv';
import { config, higgsfield } from '@higgsfield/client/v2';

// Ensure .env.local is loaded securely without logging credentials
dotenv.config({ path: '.env.local' });

if (process.env.HF_CREDENTIALS) {
  config({
    credentials: process.env.HF_CREDENTIALS,
  });
}

export interface HiggsfieldVideoRequest {
  prompt: string;
  duration?: number;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  resolution?: '720p' | '1080p';
  model?: string;
}

export interface HiggsfieldVideoResult {
  success: boolean;
  videoUrl?: string;
  requestId?: string;
  error?: string;
}

/**
 * Generates a cinematic video clip via Higgsfield AI API.
 * Uses official @higgsfield/client subscribe method.
 */
export async function generateHiggsfieldVideo(
  options: HiggsfieldVideoRequest
): Promise<HiggsfieldVideoResult> {
  if (!process.env.HF_CREDENTIALS) {
    return {
      success: false,
      error: 'HF_CREDENTIALS is not configured in .env.local',
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
        error: 'Generation completed but output video URL was not present in payload',
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
