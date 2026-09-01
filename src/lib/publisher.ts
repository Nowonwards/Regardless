import { Platform, PostContent, PlatformConnection } from '@/types';
import { buildSlideOgImageUrl } from './og/slide-generator';

export interface PublishInput {
  userId: string;
  platform: Platform;
  connection: PlatformConnection;
  content: PostContent;
  scheduledAt?: Date;
}

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
  attemptedAt: Date;
}

export interface PlatformPublisher {
  platform: Platform;
  publish(input: PublishInput): Promise<PublishResult>;
  validateConnection(connection: PlatformConnection): Promise<boolean>;
  refreshConnection(connection: PlatformConnection): Promise<PlatformConnection>;
}

export abstract class BasePublisher implements PlatformPublisher {
  abstract platform: Platform;

  abstract publish(input: PublishInput): Promise<PublishResult>;

  async validateConnection(connection: PlatformConnection): Promise<boolean> {
    if (connection.status !== 'CONNECTED') return false;
    if (connection.expiresAt && new Date(connection.expiresAt) < new Date()) return false;
    return true;
  }

  async refreshConnection(connection: PlatformConnection): Promise<PlatformConnection> {
    return connection;
  }

  protected formatContentForPlatform(content: PostContent): {
    caption: string;
    mediaUrls: string[];
    mediaType: 'image' | 'video' | 'carousel';
    hashtags: string[];
    altText: string;
  } {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const totalSlides = content.slides.length;
    const mediaUrls = content.slides.map((s, idx) => {
      let url = s.imageUrl;
      if (!url) {
        url = buildSlideOgImageUrl({
          headline: s.headline || s.text || `Slide ${idx + 1}`,
          take: s.body || '',
          slideNumber: idx + 1,
          totalSlides,
          handle: '@regardless.ai',
        });
      }
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      return `${appUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    });

    const altTexts = content.slides
      .filter((s) => s.altText || s.text)
      .map((s) => s.altText || s.text || '')
      .join(' | ');

    return {
      caption: content.caption,
      mediaUrls,
      mediaType: content.format === 'carousel' || totalSlides > 1 ? 'carousel' : content.format === 'video' ? 'video' : 'image',
      hashtags: content.hashtags,
      altText: altTexts,
    };
  }
}

export class InstagramPublisher extends BasePublisher {
  platform = 'INSTAGRAM' as const;

  async publish(input: PublishInput): Promise<PublishResult> {
    const { publishToPlatform } = await import('./composio');
    const formatted = this.formatContentForPlatform(input.content);

    try {
      const result = await publishToPlatform(input.userId, 'INSTAGRAM', formatted);
      return {
        success: true,
        platformPostId: result.postId,
        platformUrl: result.url,
        attemptedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        attemptedAt: new Date(),
      };
    }
  }
}

export class LinkedInPublisher extends BasePublisher {
  platform = 'LINKEDIN' as const;

  async publish(input: PublishInput): Promise<PublishResult> {
    const { publishToPlatform } = await import('./composio');
    const formatted = this.formatContentForPlatform(input.content);

    try {
      const result = await publishToPlatform(input.userId, 'LINKEDIN', formatted);
      return {
        success: true,
        platformPostId: result.postId,
        platformUrl: result.url,
        attemptedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        attemptedAt: new Date(),
      };
    }
  }
}

export class PinterestPublisher extends BasePublisher {
  platform = 'PINTEREST' as const;

  async publish(input: PublishInput): Promise<PublishResult> {
    const { publishToPlatform } = await import('./composio');
    const formatted = this.formatContentForPlatform(input.content);

    try {
      const result = await publishToPlatform(input.userId, 'PINTEREST', formatted);
      return {
        success: true,
        platformPostId: result.postId,
        platformUrl: result.url,
        attemptedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        attemptedAt: new Date(),
      };
    }
  }
}

export function getPublisher(platform: Platform): PlatformPublisher {
  switch (platform) {
    case 'INSTAGRAM':
      return new InstagramPublisher();
    case 'LINKEDIN':
      return new LinkedInPublisher();
    case 'PINTEREST':
      return new PinterestPublisher();
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

export const publishers: Record<Platform, PlatformPublisher> = {
  INSTAGRAM: new InstagramPublisher(),
  LINKEDIN: new LinkedInPublisher(),
  PINTEREST: new PinterestPublisher(),
};