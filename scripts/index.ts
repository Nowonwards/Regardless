import dotenv from 'dotenv';
import { config, higgsfield } from '@higgsfield/client/v2';

// Load environment variables from .env.local securely without logging or exposing credentials
dotenv.config({ path: '.env.local' });

config({
  credentials: process.env.HF_CREDENTIALS,
});

async function main() {
  console.log('Submitting video generation to bytedance/seedance-2.5/text-to-video...');

  try {
    const result = await higgsfield.subscribe(
      'bytedance/seedance-2.5/text-to-video',
      {
        input: {
          prompt: 'A cinematic scene at sunset',
          duration: 5,
          resolution: '720p',
          aspect_ratio: '16:9',
        },
        withPolling: true,
      }
    );

    console.log(`Status: ${result.status}`);
    console.log(`Request ID: ${result.request_id}`);

    if (result.status === 'completed') {
      const videoUrl =
        result.video?.url ||
        (result as any).videos?.[0]?.url ||
        (result as any).output?.video_url;

      if (videoUrl) {
        console.log(`Generated Video URL: ${videoUrl}`);
        return videoUrl;
      } else {
        console.error('Request completed but no video URL was found in payload:', JSON.stringify(result));
        process.exit(1);
      }
    } else if (result.status === 'nsfw') {
      console.error('Request was moderated and flagged by safety filters (NSFW).');
      process.exit(1);
    } else if (result.status === 'failed') {
      console.error('Video generation request failed on Higgsfield backend.');
      process.exit(1);
    } else {
      console.error(`Video generation finished with unexpected status: ${result.status}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error('Higgsfield API Error:', error?.message || error);
    if (error?.status) console.error(`HTTP Status: ${error.status}`);
    process.exit(1);
  }
}

main();
