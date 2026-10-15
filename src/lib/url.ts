import { NextRequest } from 'next/server';

/**
 * Dynamically resolves the application base URL based on:
 * 1. An explicit environment variable (NEXT_PUBLIC_APP_URL or APP_URL).
 *    If on Vercel and the variable still contains 'localhost', it falls back to the deployed URL.
 * 2. Incoming request context (origin or x-forwarded-host headers).
 * 3. Vercel deployment variables (VERCEL_PROJECT_PRODUCTION_URL or VERCEL_URL).
 * 4. Local development fallback (http://localhost:3000).
 */
export function getAppUrl(
  request?: Request | NextRequest | { headers: Headers | { get(name: string): string | null } }
): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  const isVercel = Boolean(process.env.VERCEL);

  // 1. If explicit env variable is set and not accidentally pointing to localhost on Vercel:
  if (envUrl && (!isVercel || (!envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')))) {
    return envUrl.replace(/\/$/, '');
  }

  // 2. Derive dynamically from request headers if available
  if (request) {
    const origin = request.headers.get('origin');
    if (origin) {
      return origin.replace(/\/$/, '');
    }
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = forwardedHost || request.headers.get('host');
    if (host) {
      const proto = request.headers.get('x-forwarded-proto') || (isVercel ? 'https' : 'http');
      return `${proto}://${host}`.replace(/\/$/, '');
    }
  }

  // 3. Fallback to Vercel system environment variables
  if (process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }

  // 4. Default to configured envUrl or localhost
  return (envUrl || 'http://localhost:3000').replace(/\/$/, '');
}
