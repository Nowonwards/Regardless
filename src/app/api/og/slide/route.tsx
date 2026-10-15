import { NextRequest } from 'next/server';
import { renderSlideImageResponse } from '@/lib/og/slide-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const headline = searchParams.get('headline') || 'The Open-Weight AI Lobby';
    const take = searchParams.get('take') || 'Meta, Microsoft, and Nvidia are lobbying the US government for Open-Weight AI. But is it altruism... or a power move?';
    const slideNumber = parseInt(searchParams.get('slideNumber') || '1', 10) || 1;
    const totalSlides = parseInt(searchParams.get('totalSlides') || '6', 10) || 6;
    const handle = searchParams.get('handle') || '@regardless.ai';

    return await renderSlideImageResponse({
      headline,
      take,
      slideNumber,
      totalSlides,
      handle,
    });
  } catch (error) {
    console.error('OG Image generation error:', error);
    return new Response('Failed to generate slide image', { status: 500 });
  }
}
