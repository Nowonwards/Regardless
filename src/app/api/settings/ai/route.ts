import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getUserAiConfig, saveUserAiConfig } from '@/lib/ai-config';

/**
 * GET /api/settings/ai
 * Returns the active user's AI configurations, masked keys, and model routing.
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await getUserAiConfig(user.id);
    return NextResponse.json({ config });
  } catch (error: any) {
    console.error('[/api/settings/ai GET]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch AI settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/ai
 * Updates user AI provider credentials and task routing choices.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const config = await saveUserAiConfig(user.id, body);

    return NextResponse.json({
      success: true,
      message: 'AI provider settings and routing updated successfully.',
      config,
    });
  } catch (error: any) {
    console.error('[/api/settings/ai POST]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save AI settings' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/ai?provider=ollama|higgsfield|composio
 * Explicitly disconnects an AI provider and removes its key from the database.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const provider = url.searchParams.get('provider') as 'ollama' | 'higgsfield' | 'composio';

    if (!provider || !['ollama', 'higgsfield', 'composio'].includes(provider)) {
      return NextResponse.json(
        { error: 'Valid provider (ollama, higgsfield, composio) is required.' },
        { status: 400 }
      );
    }

    const config = await saveUserAiConfig(user.id, { disconnect: provider });

    return NextResponse.json({
      success: true,
      message: `${provider} has been disconnected.`,
      config,
    });
  } catch (error: any) {
    console.error('[/api/settings/ai DELETE]', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to disconnect AI provider' },
      { status: 500 }
    );
  }
}
