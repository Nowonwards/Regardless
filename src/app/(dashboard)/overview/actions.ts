'use server';

import { getAuthUser } from '@/lib/auth';
import { publishSinglePost, retryFailedPost } from '@/lib/jobs/scheduler';
import { revalidatePath } from 'next/cache';

export async function publishNowAction(postId: string) {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const success = await publishSinglePost(postId, user.id);
  revalidatePath('/overview');
  return { success };
}

export async function retryPostAction(postId: string) {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const success = await retryFailedPost(postId, user.id);
  revalidatePath('/overview');
  return { success };
}
