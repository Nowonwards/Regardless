import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Platform, PostStatus, PostContent, Slide } from '@/types';
import { Prisma } from '@prisma/client';
import { createNotification } from '@/lib/notifications';
import { publishToPlatform } from '@/lib/composio';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;
    const body = await request.json();

    const {
      title,
      platform,
      slides,
      caption,
      hashtags = [],
      scheduledAt,
      publishImmediately = false,
    } = body;

    if (!title || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: title and platform are required' },
        { status: 400 }
      );
    }

    const formattedSlides: Slide[] = Array.isArray(slides) && slides.length > 0
      ? slides.map((s: any, idx: number): Slide => ({
          id: s.id || `slide-${idx + 1}`,
          type: (s.type === 'image' || s.type === 'text' || s.type === 'mixed') ? s.type : 'mixed',
          imagePrompt: s.imagePrompt || '',
          imageUrl: s.imageUrl || undefined,
          text: s.text || s.body || '',
          headline: s.headline || `Slide ${idx + 1}`,
          body: s.body || s.text || '',
          order: idx + 1,
        }))
      : [
          {
            id: 'slide-1',
            type: 'mixed',
            headline: title,
            body: caption || '',
            order: 1,
          },
        ];

    const postContent: PostContent = {
      slides: formattedSlides,
      caption: caption || title,
      hashtags: Array.isArray(hashtags) ? hashtags : [],
      altTexts: formattedSlides.map((s, idx) => s.headline || `Slide ${idx + 1}`),
      format: formattedSlides.length > 1 ? 'carousel' : platform === 'PINTEREST' ? 'pin' : 'single-image',
    };

    let status: PostStatus = 'APPROVED';
    let scheduledDate: Date | null = null;

    if (scheduledAt) {
      const parsedDate = new Date(scheduledAt);
      if (!isNaN(parsedDate.getTime()) && parsedDate > new Date()) {
        status = 'SCHEDULED';
        scheduledDate = parsedDate;
      }
    }

    const post = await prisma.post.create({
      data: {
        userId,
        platform: platform as Platform,
        title,
        content: postContent as unknown as Prisma.InputJsonValue,
        status,
        scheduledAt: scheduledDate,
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            content: postContent as unknown as Prisma.InputJsonValue,
            feedback: 'Created manually via Studio',
          },
        },
      },
      include: {
        versions: true,
      },
    });

    if (publishImmediately) {
      try {
        const mediaUrls = formattedSlides
          .map((s) => s.imageUrl)
          .filter(Boolean) as string[];

        const publishResult = await publishToPlatform(
          userId,
          platform as Platform,
          {
            caption: postContent.caption,
            mediaUrls,
            mediaType: mediaUrls.length > 1 ? 'carousel' : 'image',
            hashtags: postContent.hashtags,
          }
        );

        if (publishResult?.postId) {
          const updatedPost = await prisma.post.update({
            where: { id: post.id },
            data: {
              status: 'POSTED',
              publishedAt: new Date(),
            },
            include: { versions: true },
          });

          await createNotification({
            userId,
            title: 'Post Published Live!',
            message: `"${post.title}" has been successfully published to ${platform}.`,
            type: 'POST_PUBLISHED',
            platform: platform as Platform,
            postId: post.id,
          });

          return NextResponse.json({ post: updatedPost, published: true });
        }
      } catch (pubErr) {
        console.error('Immediate publish error on manual post:', pubErr);
      }
    }

    await createNotification({
      userId,
      title: status === 'SCHEDULED' ? 'Post Scheduled' : 'Post Created & Approved',
      message: status === 'SCHEDULED'
        ? `"${post.title}" is scheduled to be published on ${scheduledDate?.toLocaleString()}.`
        : `"${post.title}" is ready in your Approved posts queue.`,
      type: status === 'SCHEDULED' ? 'POST_SCHEDULED' : 'INFO',
      platform: platform as Platform,
      postId: post.id,
    });

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Create manual post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
