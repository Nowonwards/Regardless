import { prisma } from '@/lib/prisma';
import { getPublisher, PublishInput } from '@/lib/publisher';
import { Platform, PostStatus, PlatformConnection } from '@/types';
import { createNotification } from '@/lib/notifications';

export async function processScheduledPosts(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const now = new Date();

  const scheduledPosts = await prisma.post.findMany({
    where: {
      status: 'SCHEDULED' as PostStatus,
      scheduledAt: { lte: now },
    },
    include: {
      user: true,
      versions: { orderBy: { version: 'desc' }, take: 1 },
    },
  });

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const post of scheduledPosts) {
    processed++;

    try {
      const connection = await prisma.platformConnection.findUnique({
        where: { userId_platform: { userId: post.userId, platform: post.platform } },
      });

      if (!connection || connection.status !== 'CONNECTED') {
        throw new Error(`Platform ${post.platform} not connected`);
      }

      const publisher = getPublisher(post.platform);
      const isValid = await publisher.validateConnection(connection);

      if (!isValid) {
        throw new Error(`Platform ${post.platform} connection expired`);
      }

      const content = post.versions[0]?.content || post.content;

      const publishInput: PublishInput = {
        userId: post.userId,
        platform: post.platform,
        connection: connection as PlatformConnection,
        content: content as unknown as import('@/types').PostContent,
        scheduledAt: post.scheduledAt || undefined,
      };

      const result = await publisher.publish(publishInput);

      await prisma.publishAttempt.create({
        data: {
          postId: post.id,
          platform: post.platform,
          status: result.success ? 'success' : 'failed',
          response: result.platformPostId ? { postId: result.platformPostId, url: result.platformUrl } : undefined,
          error: result.error,
          attemptedAt: result.attemptedAt,
          completedAt: new Date(),
        },
      });

      if (result.success) {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'POSTED' as PostStatus,
            publishedAt: new Date(),
            errorMessage: null,
          },
        });
        await createNotification({
          userId: post.userId,
          title: 'Post Published Live 🚀',
          message: `"${post.title}" has been published to ${post.platform}.`,
          type: 'POST_PUBLISHED',
          platform: post.platform,
          postId: post.id,
        });
        succeeded++;
      } else {
        await prisma.post.update({
          where: { id: post.id },
          data: {
            status: 'FAILED' as PostStatus,
            errorMessage: result.error,
          },
        });
        await createNotification({
          userId: post.userId,
          title: 'Publishing Failed ⚠️',
          message: `Failed to publish "${post.title}" to ${post.platform}: ${result.error || 'Unknown error'}`,
          type: 'POST_FAILED',
          platform: post.platform,
          postId: post.id,
        });
        failed++;
      }
    } catch (error) {
      failed++;

      const errMsg = error instanceof Error ? error.message : 'Unknown error';

      await prisma.publishAttempt.create({
        data: {
          postId: post.id,
          platform: post.platform,
          status: 'failed',
          error: errMsg,
          attemptedAt: new Date(),
          completedAt: new Date(),
        },
      });

      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'FAILED' as PostStatus,
          errorMessage: errMsg,
        },
      });

      await createNotification({
        userId: post.userId,
        title: 'Publishing Error ⚠️',
        message: `Error publishing "${post.title}" to ${post.platform}: ${errMsg}`,
        type: 'POST_FAILED',
        platform: post.platform,
        postId: post.id,
      });

      console.error(`Failed to publish post ${post.id}:`, error);
    }
  }

  return { processed, succeeded, failed };
}

export async function publishSinglePost(postId: string, userId: string): Promise<boolean> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { user: true, versions: { orderBy: { version: 'desc' }, take: 1 } },
  });

  if (!post || post.userId !== userId) {
    return false;
  }

  const connection = await prisma.platformConnection.findUnique({
    where: { userId_platform: { userId: post.userId, platform: post.platform } },
  });

  if (!connection || connection.status !== 'CONNECTED') {
    const errorMsg = `Please connect your ${post.platform} account in Settings before publishing.`;
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: 'FAILED' as PostStatus,
        errorMessage: errorMsg,
      },
    });
    await createNotification({
      userId: post.userId,
      title: 'Platform Not Connected ⚠️',
      message: `Cannot publish "${post.title}". ${errorMsg}`,
      type: 'POST_FAILED',
      platform: post.platform,
      postId: post.id,
    });
    return false;
  }

  const publisher = getPublisher(post.platform);
  const isValid = await publisher.validateConnection(connection);

  if (!isValid) {
    const errorMsg = `${post.platform} connection is expired or invalid. Please reconnect in Settings.`;
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: 'FAILED' as PostStatus,
        errorMessage: errorMsg,
      },
    });
    await createNotification({
      userId: post.userId,
      title: 'Connection Expired ⚠️',
      message: `Cannot publish "${post.title}". ${errorMsg}`,
      type: 'POST_FAILED',
      platform: post.platform,
      postId: post.id,
    });
    return false;
  }

  const content = post.versions[0]?.content || post.content;

  const result = await publisher.publish({
    userId: post.userId,
    platform: post.platform,
    connection: connection as PlatformConnection,
    content: content as unknown as import('@/types').PostContent,
  });

  await prisma.publishAttempt.create({
    data: {
      postId: post.id,
      platform: post.platform,
      status: result.success ? 'success' : 'failed',
      response: result.platformPostId ? { postId: result.platformPostId, url: result.platformUrl } : undefined,
      error: result.error,
      attemptedAt: result.attemptedAt,
      completedAt: new Date(),
    },
  });

  if (result.success) {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: 'POSTED' as PostStatus,
        publishedAt: new Date(),
        errorMessage: null,
      },
    });
    await createNotification({
      userId: post.userId,
      title: 'Post Published Live 🚀',
      message: `"${post.title}" has been published to ${post.platform}.`,
      type: 'POST_PUBLISHED',
      platform: post.platform,
      postId: post.id,
    });
    return true;
  } else {
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: 'FAILED' as PostStatus,
        errorMessage: result.error,
      },
    });
    await createNotification({
      userId: post.userId,
      title: 'Publishing Failed ⚠️',
      message: `Failed to publish "${post.title}" to ${post.platform}: ${result.error || 'Unknown error'}`,
      type: 'POST_FAILED',
      platform: post.platform,
      postId: post.id,
    });
    return false;
  }
}

export async function retryFailedPost(postId: string, userId: string): Promise<boolean> {
  return publishSinglePost(postId, userId);
}

let schedulerInterval: NodeJS.Timeout | null = null;
let isProcessingScheduled = false;

export function startBackgroundScheduler(intervalMs = 30_000) {
  if (schedulerInterval) return;

  console.log(`[Scheduler] Background scheduler daemon active (tick: ${intervalMs / 1000}s)`);

  const runTick = async () => {
    if (isProcessingScheduled) return;
    isProcessingScheduled = true;
    try {
      const result = await processScheduledPosts();
      if (result.processed > 0) {
        console.log(`[Scheduler] Processed ${result.processed} scheduled post(s): ${result.succeeded} succeeded, ${result.failed} failed.`);
      }
    } catch (err) {
      console.error('[Scheduler] Background error:', err);
    } finally {
      isProcessingScheduled = false;
    }
  };

  // Run initial check immediately
  runTick();

  // Schedule recurring interval
  schedulerInterval = setInterval(runTick, intervalMs);
}