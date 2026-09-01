import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        // Allow public auth pages, NextAuth API, cron endpoint, and OG image rendering
        if (path.startsWith('/auth') || path.startsWith('/api/auth') || path.startsWith('/api/cron') || path.startsWith('/api/og')) {
          return true;
        }
        // Require auth for API endpoints and dashboard routes
        if (path.startsWith('/api') ||
            path.startsWith('/chat') || path.startsWith('/drafts') ||
            path.startsWith('/calendar') || path.startsWith('/kanban') ||
            path.startsWith('/history') || path.startsWith('/settings') ||
            path.startsWith('/ideas')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};