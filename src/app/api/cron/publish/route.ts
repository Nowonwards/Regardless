import { NextRequest, NextResponse } from 'next/server';
import { processScheduledPosts } from '@/lib/jobs/scheduler';

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // If no secret configured, allow

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${cronSecret}`) return true;

  const urlSecret = request.nextUrl.searchParams.get('secret') || request.nextUrl.searchParams.get('key');
  if (urlSecret === cronSecret) return true;

  // In local development mode, permit unauthenticated triggers
  if (process.env.NODE_ENV === 'development') return true;

  return false;
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processScheduledPosts();
    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Scheduler cron GET error:', error);
    return NextResponse.json({ error: 'Scheduler job failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await processScheduledPosts();
    return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Scheduler cron POST error:', error);
    return NextResponse.json({ error: 'Scheduler job failed' }, { status: 500 });
  }
}