export type Platform = 'INSTAGRAM' | 'PINTEREST' | 'LINKEDIN';

export type PostStatus =
  | 'IDEA'
  | 'SELECTED'
  | 'DRAFTED'
  | 'IN_REVISION'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'POSTED'
  | 'FAILED';

export type ConnectionStatus = 'CONNECTED' | 'EXPIRED' | 'DISCONNECTED' | 'PENDING' | 'FAILED';

export interface PlatformConfig {
  name: string;
  color: string;
  lightColor: string;
  icon: string;
  maxSlides?: number;
  formats: PostFormat[];
}

export type PostFormat = 'carousel' | 'single-image' | 'text' | 'video' | 'pin';

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  INSTAGRAM: {
    name: 'Instagram',
    color: 'hsl(var(--instagram))',
    lightColor: 'hsl(var(--instagram-light))',
    icon: 'instagram',
    maxSlides: 10,
    formats: ['carousel', 'single-image', 'video'],
  },
  PINTEREST: {
    name: 'Pinterest',
    color: 'hsl(var(--pinterest))',
    lightColor: 'hsl(var(--pinterest-light))',
    icon: 'pinterest',
    maxSlides: 1,
    formats: ['pin'],
  },
  LINKEDIN: {
    name: 'LinkedIn',
    color: 'hsl(var(--linkedin))',
    lightColor: 'hsl(var(--linkedin-light))',
    icon: 'linkedin',
    maxSlides: 1,
    formats: ['single-image', 'text'],
  },
};

export interface IdeaContent {
  id: string;
  title: string;
  description: string;
  platform: Platform;
  hook: string;
  angle: string;
  keyPoints: string[];
  suggestedFormat: PostFormat;
  hashtags: string[];
  cta?: string;
  createdAt?: string | Date;
  sessionId?: string | null;
  sessionTitle?: string | null;
  postStatus?: PostStatus | null;
  isPublished?: boolean;
  isScheduled?: boolean;
  hasDraft?: boolean;
}

export interface PostContent {
  slides: Slide[];
  caption: string;
  hashtags: string[];
  altTexts: string[];
  format: PostFormat;
}

export interface Slide {
  id: string;
  type: 'image' | 'text' | 'mixed';
  imageUrl?: string;
  imagePrompt?: string;
  text?: string;
  headline?: string;
  body?: string;
  altText?: string;
  order: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

import { JsonValue } from '@prisma/client/runtime/library';

export interface PlatformConnection {
  id: string;
  platform: Platform;
  status: ConnectionStatus;
  composioUserId?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  metadata?: JsonValue;
  errorMessage?: string | null;
}

export interface PostWithRelations {
  id: string;
  userId: string;
  ideaId: string | null;
  platform: Platform;
  status: PostStatus;
  title: string;
  content: PostContent;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  errorMessage: string | null;
  currentVersion: number;
  createdAt: Date;
  updatedAt: Date;
  versions: PostVersion[];
  publishAttempts: PublishAttempt[];
  ideaTitle?: string;
}

export interface PostVersion {
  id: string;
  postId: string;
  version: number;
  content: PostContent;
  feedback: string | null;
  createdAt: Date;
}

export interface PublishAttempt {
  id: string;
  postId: string;
  platform: Platform;
  status: 'pending' | 'success' | 'failed';
  response?: Record<string, unknown>;
  error?: string;
  attemptedAt: Date;
  completedAt?: Date;
}

export interface CalendarViewType {
  type: 'day' | '4day' | 'week' | 'month';
  date: Date;
}

export interface KanbanColumn {
  id: PostStatus;
  title: string;
  posts: PostWithRelations[];
}