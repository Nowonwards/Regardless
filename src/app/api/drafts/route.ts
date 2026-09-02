import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCompletion } from '@/lib/ollama';
import { createDraftGenerationPrompt, createRevisionPrompt } from '@/lib/agents/prompts';
import { generateSlideImage } from '@/lib/composio';
import { buildSlideOgImageUrl } from '@/lib/og/slide-generator';
import { Platform, PostStatus, PostContent } from '@/types';
import { Prisma } from '@prisma/client';
import { createNotification } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as PostStatus | null;
    const platform = searchParams.get('platform') as Platform | null;

    const where: Record<string, unknown> = { userId };
    if (status) {
      where.status = status;
    } else {
      where.status = { not: 'POSTED' };
    }
    if (platform) where.platform = platform;

    const posts = await prisma.post.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: { orderBy: { version: 'desc' } },
        idea: true,
        publishAttempts: { orderBy: { attemptedAt: 'desc' } },
      },
    });

    const mappedPosts = posts.map((p) => ({
      ...p,
      ideaTitle: p.idea?.title || p.title,
    }));

    return NextResponse.json({ posts: mappedPosts });
  } catch (error) {
    console.error('Get drafts error:', error);
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
  }
}

function parseGeneratedDraft(
  response: string,
  idea: { title: string; description: string; hook?: string; angle?: string; keyPoints?: string[]; hashtags?: string[]; content?: Record<string, unknown> },
  platform: Platform
): PostContent {
  try {
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, response];
    const raw = (jsonMatch[1] || response).trim();
    const parsed = JSON.parse(raw);
    if (parsed.slides && Array.isArray(parsed.slides)) {
      return {
        slides: parsed.slides.map((s: any, idx: number) => ({
          id: s.id || `slide-${idx + 1}`,
          type: s.type || 'mixed',
          imagePrompt: s.imagePrompt || `Clean modern minimalist 3D graphic for ${idea.title}`,
          text: s.text || s.body || '',
          headline: s.headline || `Key Point ${idx + 1}`,
          body: s.body || s.text || '',
          order: idx + 1,
        })),
        caption: parsed.caption || `${idea.title}\n\n${idea.hook || ''}`,
        hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : ['#tech', '#programming', '#coding'],
        altTexts: Array.isArray(parsed.altTexts) ? parsed.altTexts : [`Slide visual for ${idea.title}`],
        format: parsed.format || (platform === 'PINTEREST' ? 'pin' : 'carousel'),
      };
    }
  } catch (err) {
    console.warn('Fallback draft generation parsing for idea:', idea.title);
  }

  const keyPoints = Array.isArray(idea.content?.keyPoints)
    ? (idea.content.keyPoints as string[])
    : Array.isArray(idea.keyPoints)
    ? idea.keyPoints
    : [];

  const slides = [
    {
      id: 'slide-1',
      type: 'mixed' as const,
      imagePrompt: `High-tech visual for "${idea.title}", sharp minimalist aesthetics, dark mode coding vibe`,
      headline: idea.title,
      body: idea.hook || idea.description || '',
      text: idea.title,
      order: 1,
    },
    ...keyPoints.map((pt: string, idx: number) => ({
      id: `slide-${idx + 2}`,
      type: 'text' as const,
      imagePrompt: `Infographic background for step ${idx + 1}`,
      headline: `Takeaway ${idx + 1}`,
      body: pt,
      text: pt,
      order: idx + 2,
    })),
  ];

  return {
    slides,
    caption: `${idea.title}\n\n${idea.hook || ''}\n\n${idea.angle || ''}\n\n${(idea.hashtags || ['#tech', '#programming']).join(' ')}`,
    hashtags: idea.hashtags || ['#tech', '#programming', '#finance'],
    altTexts: slides.map((s) => s.headline),
    format: platform === 'PINTEREST' ? 'pin' : 'carousel',
  };
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;
    const body = await request.json();

    // 1. Check if this is a batch draft generation request (from IdeasSelector / ChatPage)
    if (body.ideaTitles || body.ideas || body.ideaIds) {
      const { sessionId, ideaTitles = [], ideas = [] } = body;
      const targetTitles: string[] = ideaTitles.length > 0 ? ideaTitles : ideas.map((i: any) => i.title);

      if (targetTitles.length === 0 && ideas.length === 0) {
        return NextResponse.json({ error: 'No ideas specified for draft generation' }, { status: 400 });
      }

      // Fetch any existing ideas in DB or use the passed ideas list
      let dbIdeas = await prisma.idea.findMany({
        where: {
          userId,
          ...(sessionId ? { sessionId } : {}),
          title: { in: targetTitles },
        },
      });

      const promises = targetTitles.map(async (title) => {
        let ideaObj = dbIdeas.find((i) => i.title === title) as any;
        const passedIdea = ideas.find((i: any) => i.title === title);

        if (!ideaObj && passedIdea) {
          // Save idea in DB if not yet persisted
          ideaObj = await prisma.idea.create({
            data: {
              userId,
              sessionId,
              platform: (passedIdea.platform || 'INSTAGRAM') as Platform,
              title: passedIdea.title,
              description: passedIdea.description || '',
              content: (passedIdea.content || {
                hook: passedIdea.hook,
                angle: passedIdea.angle,
                keyPoints: passedIdea.keyPoints,
                suggestedFormat: passedIdea.suggestedFormat,
                hashtags: passedIdea.hashtags,
                cta: passedIdea.cta,
              }) as Prisma.InputJsonValue,
              status: 'SELECTED' as PostStatus,
              selected: true,
            },
          });
        }

        if (!ideaObj) return null;

        const platform = ideaObj.platform as Platform;
        const ideaContent = typeof ideaObj.content === 'object' ? ideaObj.content : {};

        const prompt = createDraftGenerationPrompt(
          {
            title: ideaObj.title,
            description: ideaObj.description,
            content: ideaContent as Record<string, unknown>,
            platform,
          },
          platform
        );

        let draftContent: PostContent;
        try {
          const response = await generateCompletion(prompt, { temperature: 0.7 });
          draftContent = parseGeneratedDraft(response, ideaObj, platform);
        } catch (genError) {
          console.warn('Draft generation LLM call failed, using structured fallback:', genError);
          draftContent = parseGeneratedDraft('', ideaObj, platform);
        }

        // Generate code-rendered 1080x1350 slide template images with exact typography
        if (draftContent.slides && draftContent.slides.length > 0) {
          draftContent.slides = draftContent.slides.map((slide, idx) => ({
            ...slide,
            imageUrl: buildSlideOgImageUrl({
              headline: slide.headline || (idx === 0 ? ideaObj.title : `Takeaway ${idx + 1}`),
              take: slide.body || slide.text || '',
              slideNumber: idx + 1,
              totalSlides: draftContent.slides.length,
              handle: '@regardless.ai',
            }),
          }));
        }

        const post = await prisma.post.create({
          data: {
            userId,
            ideaId: ideaObj.id,
            platform,
            title: ideaObj.title,
            content: draftContent as unknown as Prisma.InputJsonValue,
            status: 'DRAFTED' as PostStatus,
            currentVersion: 1,
            versions: {
              create: {
                version: 1,
                content: draftContent as unknown as Prisma.InputJsonValue,
              },
            },
          },
          include: { versions: true },
        });

        await prisma.idea.update({
          where: { id: ideaObj.id },
          data: { status: 'DRAFTED' as PostStatus },
        });

        return post;
      });

      const results = await Promise.all(promises);
      const createdPosts = results.filter(Boolean);

      return NextResponse.json({ success: true, posts: createdPosts, count: createdPosts.length });
    }

    // 2. Direct single post creation
    const { ideaId, platform, title, content, scheduledAt } = body;

    if (!platform || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        userId,
        ideaId,
        platform: platform as Platform,
        title,
        content: content as Prisma.InputJsonValue,
        status: 'DRAFTED' as PostStatus,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        currentVersion: 1,
        versions: {
          create: {
            version: 1,
            content: content as Prisma.InputJsonValue,
          },
        },
      },
      include: { versions: true },
    });

    if (ideaId) {
      await prisma.idea.update({
        where: { id: ideaId },
        data: { status: 'DRAFTED' as PostStatus },
      });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Create draft error:', error);
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;
    const body = await request.json();
    const { postId, content, feedback, status, scheduledAt } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });

    if (!post || post.userId !== userId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const newVersion = post.currentVersion + 1;
    const updateData: Record<string, unknown> = {
      currentVersion: newVersion,
      updatedAt: new Date(),
    };

    if (content) updateData.content = content;
    if (status) updateData.status = status;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (status === 'APPROVED') updateData.status = 'APPROVED' as PostStatus;
    if (status === 'SCHEDULED') updateData.status = 'SCHEDULED' as PostStatus;

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        ...updateData,
        versions: {
          create: {
            version: newVersion,
            content: content || post.content,
            feedback,
          },
        },
      },
      include: { versions: true },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error('Update draft error:', error);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;
    const body = await request.json();
    const { postId, action, feedback, platform } = body;

    if (!postId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { idea: true },
    });

    if (!post || post.userId !== userId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (action === 'generate') {
      const idea = post.idea;
      if (!idea) {
        return NextResponse.json({ error: 'No associated idea' }, { status: 400 });
      }

      const prompt = createDraftGenerationPrompt(
        {
          title: idea.title,
          description: idea.description,
          content: idea.content as Record<string, unknown>,
          platform: idea.platform,
        },
        platform || post.platform
      );

      const response = await generateCompletion(prompt);
      const draftContent = JSON.parse(response) as PostContent;

      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          content: draftContent as unknown as Prisma.InputJsonValue,
          status: 'DRAFTED' as PostStatus,
          currentVersion: 1,
          versions: {
            create: {
              version: 1,
              content: draftContent as unknown as Prisma.InputJsonValue,
            },
          },
        },
        include: { versions: true },
      });

      return NextResponse.json({ post: updatedPost, content: draftContent });
    }

    if (action === 'revise') {
      if (!feedback) {
        return NextResponse.json({ error: 'Feedback required for revision' }, { status: 400 });
      }

      const prompt = createRevisionPrompt(post.content as unknown as Record<string, unknown>, feedback, post.platform);
      const response = await generateCompletion(prompt);
      const revisedContent = JSON.parse(response) as PostContent;

      const newVersion = post.currentVersion + 1;
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          content: revisedContent as unknown as Prisma.InputJsonValue,
          status: 'IN_REVISION' as PostStatus,
          currentVersion: newVersion,
          versions: {
            create: {
              version: newVersion,
              content: revisedContent as unknown as Prisma.InputJsonValue,
              feedback,
            },
          },
        },
        include: { versions: true },
      });

      return NextResponse.json({ post: updatedPost, content: revisedContent });
    }

    if (action === 'approve') {
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: { status: 'APPROVED' as PostStatus },
        include: { versions: true },
      });

      return NextResponse.json({ post: updatedPost });
    }

    if (action === 'publish') {
      const { publishSinglePost } = await import('@/lib/jobs/scheduler');
      const success = await publishSinglePost(postId, userId);
      const updatedPost = await prisma.post.findUnique({
        where: { id: postId },
        include: { versions: true },
      });

      return NextResponse.json({
        success,
        post: updatedPost,
        error: success ? undefined : (updatedPost?.errorMessage || 'Publishing failed. Please check platform connection in Settings.'),
      });
    }

    if (action === 'schedule') {
      if (!body.scheduledAt) {
        return NextResponse.json({ error: 'Scheduled time required' }, { status: 400 });
      }

      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'SCHEDULED' as PostStatus,
          scheduledAt: new Date(body.scheduledAt),
        },
        include: { versions: true },
      });

      await createNotification({
        userId,
        title: 'Post Scheduled 🗓️',
        message: `"${updatedPost.title}" is scheduled to publish on ${updatedPost.platform} at ${new Date(body.scheduledAt).toLocaleString()}.`,
        type: 'POST_SCHEDULED',
        platform: updatedPost.platform,
        postId: updatedPost.id,
      });

      return NextResponse.json({ post: updatedPost });
    }

    if (action === 'unschedule' || action === 'cancel_schedule') {
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          status: 'APPROVED' as PostStatus,
          scheduledAt: null,
        },
        include: { versions: true },
      });

      return NextResponse.json({ post: updatedPost });
    }

    if (action === 'update_caption') {
      const { caption, hashtags } = body;
      const currentContent = (post.content || {}) as unknown as PostContent;
      const updatedContent: PostContent = {
        ...currentContent,
        caption: typeof caption === 'string' ? caption : currentContent.caption,
        hashtags: Array.isArray(hashtags) ? hashtags : currentContent.hashtags,
      };

      const newVersion = post.currentVersion + 1;
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          content: updatedContent as unknown as Prisma.InputJsonValue,
          currentVersion: newVersion,
          versions: {
            create: {
              version: newVersion,
              content: updatedContent as unknown as Prisma.InputJsonValue,
              feedback: 'Manual caption edit',
            },
          },
        },
        include: { versions: true },
      });

      return NextResponse.json({ success: true, post: updatedPost, content: updatedContent });
    }

    if (action === 'regenerate_caption') {
      const { comment, feedback: reqFeedback } = body;
      const userPrompt = comment || reqFeedback || '';
      const currentContent = (post.content || {}) as unknown as PostContent;

      const prompt: import('@/lib/ollama').OllamaMessage[] = [
        {
          role: 'system',
          content: `You are an expert social media copywriter for a tech, coding, and finance platform on ${post.platform}.
Your brand voice is sarcastic, opinionated, no-filter, and witty.
Write an engaging, high-converting caption with 6-10 relevant hashtags for this post.

${userPrompt ? `User specific instruction/comment: "${userPrompt}"` : ''}

Output strictly valid JSON with this format:
{
  "caption": "The full caption text formatted with clear paragraphs and appropriate emojis",
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}`,
        },
        {
          role: 'user',
          content: `Post Title: ${post.title}
Current Caption: ${currentContent.caption || ''}
Slides Context: ${JSON.stringify(currentContent.slides?.map((s) => ({ headline: s.headline, body: s.body || s.text })) || [])}`,
        },
      ];

      let generatedCaption = currentContent.caption;
      let generatedHashtags = currentContent.hashtags;

      try {
        const response = await generateCompletion(prompt, { temperature: 0.8 });
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.caption) generatedCaption = parsed.caption;
          if (Array.isArray(parsed.hashtags)) generatedHashtags = parsed.hashtags;
        }
      } catch (err) {
        console.error('Caption generation error:', err);
      }

      const updatedContent: PostContent = {
        ...currentContent,
        caption: generatedCaption,
        hashtags: generatedHashtags,
      };

      const newVersion = post.currentVersion + 1;
      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
          content: updatedContent as unknown as Prisma.InputJsonValue,
          currentVersion: newVersion,
          versions: {
            create: {
              version: newVersion,
              content: updatedContent as unknown as Prisma.InputJsonValue,
              feedback: userPrompt ? `AI caption regeneration: ${userPrompt}` : 'AI caption regeneration',
            },
          },
        },
        include: { versions: true },
      });

      return NextResponse.json({ success: true, post: updatedPost, content: updatedContent });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Draft action error:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    const post = await prisma.post.findFirst({
      where: { id: postId, userId },
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Draft delete error:', error);
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
  }
}