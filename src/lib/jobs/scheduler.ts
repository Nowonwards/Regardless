import { prisma } from '@/lib/prisma';
import { getPublisher, PublishInput } from '@/lib/publisher';
import { Platform, PostStatus, PlatformConnection } from '@/types';
import { createNotification } from '@/lib/notifications';

// Process-wide execution guard to prevent parallel overlapping sweeps
let isProcessingScheduled = false;

// Post-level lock set to guarantee a single post is never published concurrently across any worker or endpoint
const inFlightPostLocks = new Set<string>();

export async function processScheduledPosts(): Promise<{ processed: number; succeeded: number; failed: number }> {
  // Re-entrancy guard: if a sweep is already running, skip this trigger immediately
  if (isProcessingScheduled) {
    return { processed: 0, succeeded: 0, failed: 0 };
  }

  isProcessingScheduled = true;
  const now = new Date();

  try {
    const scheduledPosts = await prisma.post.findMany({
      where: {
        status: 'SCHEDULED' as PostStatus,
        scheduledAt: { lte: now },
        OR: [
          { publishingStartedAt: null },
          { publishingStartedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } }, // 10 min crash timeout
        ],
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
      // In-memory post concurrency guard
      if (inFlightPostLocks.has(post.id)) {
        continue;
      }

      // Database atomic claim: only ONE process can successfully claim the scheduled post
      const claimResult = await prisma.post.updateMany({
        where: {
          id: post.id,
          status: 'SCHEDULED' as PostStatus,
          OR: [
            { publishingStartedAt: null },
            { publishingStartedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
          ],
        },
        data: {
          publishingStartedAt: new Date(),
        },
      });

      if (claimResult.count === 0) {
        // Already claimed or published by another worker
        continue;
      }

      inFlightPostLocks.add(post.id);
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
              publishingStartedAt: null,
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
              publishingStartedAt: null,
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
            publishingStartedAt: null,
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
      } finally {
        inFlightPostLocks.delete(post.id);
      }
    }

    return { processed, succeeded, failed };
  } finally {
    isProcessingScheduled = false;
  }
}

export async function publishSinglePost(postId: string, userId: string): Promise<boolean> {
  // In-flight mutex check
  if (inFlightPostLocks.has(postId)) {
    console.warn(`[Scheduler] Post ${postId} is already in the middle of being published. Skipping.`);
    return false;
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { user: true, versions: { orderBy: { version: 'desc' }, take: 1 } },
  });

  if (!post || post.userId !== userId) {
    return false;
  }

  // Idempotency: if already posted, do not publish again
  if (post.status === 'POSTED') {
    console.warn(`[Scheduler] Post ${postId} is already POSTED. Skipping duplicate publish.`);
    return true;
  }

  // Database atomic claim
  const claimResult = await prisma.post.updateMany({
    where: {
      id: post.id,
      status: { not: 'POSTED' as PostStatus },
      OR: [
        { publishingStartedAt: null },
        { publishingStartedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } },
      ],
    },
    data: {
      publishingStartedAt: new Date(),
    },
  });

  if (claimResult.count === 0) {
    console.warn(`[Scheduler] Post ${postId} is currently being published by another worker.`);
    return false;
  }

  inFlightPostLocks.add(postId);

  try {
    const connection = await prisma.platformConnection.findUnique({
      where: { userId_platform: { userId: post.userId, platform: post.platform } },
    });

    if (!connection || connection.status !== 'CONNECTED') {
      const errorMsg = `Please connect your ${post.platform} account in Settings before publishing.`;
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: 'FAILED' as PostStatus,
          publishingStartedAt: null,
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
          publishingStartedAt: null,
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
          publishingStartedAt: null,
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
          publishingStartedAt: null,
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
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    await prisma.post.update({
      where: { id: post.id },
      data: {
        status: 'FAILED' as PostStatus,
        publishingStartedAt: null,
        errorMessage: errMsg,
      },
    });
    return false;
  } finally {
    inFlightPostLocks.delete(postId);
  }
}

export async function retryFailedPost(postId: string, userId: string): Promise<boolean> {
  return publishSinglePost(postId, userId);
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startBackgroundScheduler(intervalMs = 30_000) {
  if (schedulerInterval) return;

  console.log(`[Scheduler] Background scheduler daemon active (tick: ${intervalMs / 1000}s)`);

  const runTick = async () => {
    try {
      const result = await processScheduledPosts();
      if (result.processed > 0) {
        console.log(`[Scheduler] Processed ${result.processed} scheduled post(s): ${result.succeeded} succeeded, ${result.failed} failed.`);
      }
    } catch (err) {
      console.error('[Scheduler] Background error:', err);
    }
  };

  // Run initial check immediately
  runTick();

  // Schedule recurring interval
  schedulerInterval = setInterval(runTick, intervalMs);
}