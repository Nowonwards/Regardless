import React from 'react';
import { redirect } from 'next/navigation';
import { startOfDay, endOfDay, addDays } from 'date-fns';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { OverviewClient, OverviewPost } from './OverviewClient';

export const metadata = {
  title: 'Overview – Regardless Studio',
};

function formatPostForOverview(post: any): OverviewPost {
  const content = (post.versions?.[0]?.content || post.content) as any;
  const slides = Array.isArray(content?.slides) ? content.slides : [];
  const s0 = slides[0];

  return {
    id: post.id,
    title: post.title,
    status: post.status,
    platform: post.platform,
    scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString() : null,
    errorMessage: post.errorMessage,
    slidesCount: Math.max(slides.length, 1),
    firstSlide: s0
      ? {
          headline: s0.headline,
          text: s0.text || s0.body,
          imageUrl: s0.imageUrl,
        }
      : null,
  };
}

export default async function OverviewPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect('/sign-in');
  }

  const userId = user.id;
  const now = new Date();
  const startOfTodayDate = startOfDay(now);
  const in7Days = addDays(now, 7);
  const endOf7DaysDate = endOfDay(addDays(startOfTodayDate, 6));

  const [
    scheduledThisWeekCount,
    needsApprovalCount,
    failedCount,
    nextPostRaw,
    ideasCount,
    draftedCount,
    revisionCount,
    approvedCount,
    scheduledCount,
    postedCount,
    weekPostsRaw,
    failedPostRaw,
    queuePostsRaw,
  ] = await Promise.all([
    prisma.post.count({
      where: {
        userId,
        status: 'SCHEDULED',
        scheduledAt: {
          gte: now,
          lte: in7Days,
        },
      },
    }),
    prisma.post.count({
      where: {
        userId,
        status: { in: ['DRAFTED', 'IN_REVISION'] },
      },
    }),
    prisma.post.count({
      where: {
        userId,
        status: 'FAILED',
      },
    }),
    prisma.post.findFirst({
      where: {
        userId,
        status: 'SCHEDULED',
        scheduledAt: { gte: now },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.idea.count({ where: { userId } }),
    prisma.post.count({ where: { userId, status: 'DRAFTED' } }),
    prisma.post.count({ where: { userId, status: 'IN_REVISION' } }),
    prisma.post.count({ where: { userId, status: 'APPROVED' } }),
    prisma.post.count({ where: { userId, status: 'SCHEDULED' } }),
    prisma.post.count({ where: { userId, status: 'POSTED' } }),
    prisma.post.findMany({
      where: {
        userId,
        scheduledAt: {
          gte: startOfTodayDate,
          lte: endOf7DaysDate,
        },
        status: { in: ['SCHEDULED', 'APPROVED', 'DRAFTED'] },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    prisma.post.findFirst({
      where: {
        userId,
        status: 'FAILED',
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.post.findMany({
      where: {
        userId,
        status: { in: ['SCHEDULED', 'APPROVED'] },
      },
      orderBy: [
        { scheduledAt: 'asc' },
        { updatedAt: 'desc' },
      ],
      take: 4,
    }),
  ]);

  const nextPost = nextPostRaw ? formatPostForOverview(nextPostRaw) : null;
  const failedPost = failedPostRaw ? formatPostForOverview(failedPostRaw) : null;
  const weekPosts = weekPostsRaw.map(formatPostForOverview);
  const queuePosts = queuePostsRaw.map(formatPostForOverview);

  return (
    <OverviewClient
      headlineCount={scheduledThisWeekCount}
      needsApprovalCount={needsApprovalCount}
      failedCount={failedCount}
      nextPost={nextPost}
      pipelineCounts={{
        ideas: ideasCount,
        drafted: draftedCount,
        revision: revisionCount,
        approved: approvedCount,
        scheduled: scheduledCount,
        posted: postedCount,
      }}
      weekPosts={weekPosts}
      failedPost={failedPost}
      queuePosts={queuePosts}
    />
  );
}
