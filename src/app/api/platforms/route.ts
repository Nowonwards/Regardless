import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  initiatePlatformConnection,
  getPlatformConnectionStatus,
  disconnectPlatform,
  SupportedPlatform,
} from '@/lib/composio';
import { Platform, ConnectionStatus } from '@/types';

/**
 * GET /api/platforms
 * Returns all platform connections for the authenticated user.
 * Automatically reconciles stale PENDING connections.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    let connections = await prisma.platformConnection.findMany({
      where: { userId },
    });

    // Reconcile any PENDING connections:
    // If user completed auth or abandoned it, update accordingly.
    const now = Date.now();
    for (const conn of connections) {
      if (conn.status === 'PENDING') {
        const isStale = now - new Date(conn.updatedAt).getTime() > 15000; // > 15s
        try {
          const liveStatus = await getPlatformConnectionStatus(userId, conn.platform as SupportedPlatform);
          if (liveStatus.connected) {
            await prisma.platformConnection.update({
              where: { id: conn.id },
              data: {
                status: 'CONNECTED',
                composioUserId: liveStatus.connectedAccountId,
                errorMessage: null,
              },
            });
            conn.status = 'CONNECTED';
          } else if (isStale) {
            // Reset stale pending back to DISCONNECTED so user can retry
            await prisma.platformConnection.update({
              where: { id: conn.id },
              data: { status: 'DISCONNECTED' },
            });
            conn.status = 'DISCONNECTED';
          }
        } catch {
          if (isStale) {
            conn.status = 'DISCONNECTED';
          }
        }
      }
    }

    return NextResponse.json({ connections });
  } catch (error) {
    console.error('[/api/platforms GET]', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

/**
 * POST /api/platforms
 * Initiates a Composio OAuth flow for the given platform.
 * Returns { authUrl } — redirect the user to this URL.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { platform } = body as { platform: Platform };

    if (!platform || !['INSTAGRAM', 'LINKEDIN', 'PINTEREST'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid or missing platform' }, { status: 400 });
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings?connected=${platform}&status=success`;

    const result = await initiatePlatformConnection(
      userId,
      platform as SupportedPlatform,
      callbackUrl
    );

    // Upsert the local DB record so we can track the pending state
    await prisma.platformConnection.upsert({
      where: { userId_platform: { userId, platform } },
      create: {
        userId,
        platform,
        composioUserId: result.connectedAccountId,
        status: 'PENDING' as ConnectionStatus,
      },
      update: {
        composioUserId: result.connectedAccountId,
        status: 'PENDING' as ConnectionStatus,
        errorMessage: null,
      },
    });

    return NextResponse.json({ authUrl: result.authUrl });
  } catch (error) {
    console.error('[/api/platforms POST]', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate connection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/platforms?platform=INSTAGRAM
 * Disconnects a platform and removes tokens from DB.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform') as Platform | null;

    if (!platform || !['INSTAGRAM', 'LINKEDIN', 'PINTEREST'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid or missing platform' }, { status: 400 });
    }

    // Disconnect from Composio
    await disconnectPlatform(userId, platform as SupportedPlatform);

    // Update local DB
    try {
      await prisma.platformConnection.update({
        where: { userId_platform: { userId, platform } },
        data: {
          status: 'DISCONNECTED' as ConnectionStatus,
          accessToken: null,
          refreshToken: null,
        },
      });
    } catch {
      // Record may not exist — ignore
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[/api/platforms DELETE]', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}

/**
 * PATCH /api/platforms
 * Called after the OAuth callback to finalize the connection and update local DB status.
 * Body: { platform: 'INSTAGRAM' | 'LINKEDIN' | 'PINTEREST' }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { platform } = body as { platform: Platform };

    if (!platform || !['INSTAGRAM', 'LINKEDIN', 'PINTEREST'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid or missing platform' }, { status: 400 });
    }

    // Re-check connection status from Composio
    const status = await getPlatformConnectionStatus(userId, platform as SupportedPlatform);

    if (status.connected) {
      await prisma.platformConnection.upsert({
        where: { userId_platform: { userId, platform } },
        create: {
          userId,
          platform,
          composioUserId: status.connectedAccountId ?? '',
          status: 'CONNECTED' as ConnectionStatus,
        },
        update: {
          status: 'CONNECTED' as ConnectionStatus,
          composioUserId: status.connectedAccountId ?? '',
          errorMessage: null,
        },
      });
    } else {
      // If not active in Composio, set status to DISCONNECTED
      await prisma.platformConnection.upsert({
        where: { userId_platform: { userId, platform } },
        create: {
          userId,
          platform,
          status: 'DISCONNECTED' as ConnectionStatus,
        },
        update: {
          status: 'DISCONNECTED' as ConnectionStatus,
        },
      });
    }

    return NextResponse.json({ success: true, connected: status.connected });
  } catch (error) {
    console.error('[/api/platforms PATCH]', error);
    return NextResponse.json({ error: 'Failed to complete connection' }, { status: 500 });
  }
}