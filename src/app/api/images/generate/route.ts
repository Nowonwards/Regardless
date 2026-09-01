import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildSlideOgImageUrl } from '@/lib/og/slide-generator';
import { generateSlideImage } from '@/lib/composio';
import { PostContent } from '@/types';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = await getServerSession(authOptions);
    if (!sessionToken?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = sessionToken.user.id;
    const body = await request.json();
    const { postId, slideId, generateAll, mode = 'template', headline, take, prompt } = body;

    if (!postId) {
      return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 }, idea: true },
    });

    if (!post || post.userId !== userId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const content = post.content as unknown as PostContent;
    if (!content || !content.slides || content.slides.length === 0) {
      return NextResponse.json({ error: 'Invalid post content' }, { status: 400 });
    }

    if (generateAll) {
      const updatedSlides = await Promise.all(
        content.slides.map(async (slide, idx) => {
          const factLine = slide.headline || (idx === 0 ? post.title : `Key Point ${idx + 1}`);
          const takeLine = slide.body || slide.text || '';

          if (mode === 'ai') {
            const aiPrompt = slide.imagePrompt || `${post.title} - ${factLine}`;
            try {
              const aiUrl = await generateSlideImage(aiPrompt, userId, '4:5');
              return { ...slide, imageUrl: aiUrl || slide.imageUrl };
            } catch (e) {
              console.warn(`AI visual generation failed for slide ${slide.id}:`, e);
              return slide;
            }
          }

          const imageUrl = buildSlideOgImageUrl({
            headline: factLine,
            take: takeLine,
            slideNumber: idx + 1,
            totalSlides: content.slides.length,
            handle: '@regardless.ai',
          });
          return {
            ...slide,
            imageUrl,
          };
        })
      );

      const updatedContent: PostContent = {
        ...content,
        slides: updatedSlides,
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
              feedback: mode === 'ai' ? 'Regenerated all slide visuals with AI (Gemini)' : 'Regenerated all slide card template PNGs',
            },
          },
        },
        include: { versions: true, idea: true },
      });

      return NextResponse.json({
        success: true,
        post: {
          ...updatedPost,
          ideaTitle: updatedPost.idea?.title || updatedPost.title,
        },
      });
    }

    // Single slide generation
    const slideIndex = content.slides.findIndex((s) => s.id === slideId);
    const targetIdx = slideIndex >= 0 ? slideIndex : 0;
    const targetSlide = content.slides[targetIdx];
    const factLine = headline || targetSlide.headline || (targetIdx === 0 ? post.title : `Key Point ${targetIdx + 1}`);
    const takeLine = take || targetSlide.body || targetSlide.text || '';

    let imageUrl: string | null = null;

    if (mode === 'ai') {
      const aiPrompt = prompt || targetSlide.imagePrompt || `${post.title} - ${factLine}`;
      imageUrl = await generateSlideImage(aiPrompt, userId, '4:5');
    } else {
      imageUrl = buildSlideOgImageUrl({
        headline: factLine,
        take: takeLine,
        slideNumber: targetIdx + 1,
        totalSlides: content.slides.length,
        handle: '@regardless.ai',
      });
    }

    if (!imageUrl) {
      return NextResponse.json({ error: 'Failed to generate slide image' }, { status: 500 });
    }

    const updatedSlides = [...content.slides];
    const idx = slideIndex >= 0 ? slideIndex : 0;
    updatedSlides[idx] = {
      ...updatedSlides[idx],
      headline: headline || updatedSlides[idx].headline,
      body: take || updatedSlides[idx].body,
      imageUrl,
    };

    const updatedContent: PostContent = {
      ...content,
      slides: updatedSlides,
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
            feedback: `Regenerated slide visual for slide ${targetIdx + 1}`,
          },
        },
      },
      include: { versions: true, idea: true },
    });

    return NextResponse.json({
      success: true,
      imageUrl,
      post: {
        ...updatedPost,
        ideaTitle: updatedPost.idea?.title || updatedPost.title,
      },
    });
  } catch (error) {
    console.error('Image generation route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
