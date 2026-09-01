/**
 * Next.js Server Instrumentation
 * Starts the automatic background scheduler daemon on server startup.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startBackgroundScheduler } = await import('@/lib/jobs/scheduler');
    startBackgroundScheduler(30_000); // Check every 30 seconds
  }
}
