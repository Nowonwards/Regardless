import { prisma } from '@/lib/prisma';
import { Platform } from '@/types';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type?: 'POST_PUBLISHED' | 'POST_FAILED' | 'POST_SCHEDULED' | 'INFO';
  platform?: Platform;
  postId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    return await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type || 'INFO',
        platform: input.platform,
        postId: input.postId,
        read: false,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

export async function getUserNotifications(userId: string, limit = 20) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false },
    });

    return { notifications, unreadCount };
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return { notifications: [], unreadCount: 0 };
  }
}

export async function markNotificationAsRead(id: string, userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return null;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return null;
  }
}
