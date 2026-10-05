import React from 'react';
import { ImageResponse } from 'next/og';

export interface SlideCardData {
  headline: string;
  take: string;
  slideNumber: number;
  totalSlides: number;
  handle?: string;
}

let interRegularFont: ArrayBuffer | null = null;
let interBoldFont: ArrayBuffer | null = null;

/**
 * Loads and caches Inter fonts for Satori image rendering.
 */
async function loadFonts(): Promise<Array<{ name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }>> {
  try {
    if (!interRegularFont) {
      const res = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff');
      if (res.ok) {
        interRegularFont = await res.arrayBuffer();
      }
    }
    if (!interBoldFont) {
      const res = await fetch('https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff');
      if (res.ok) {
        interBoldFont = await res.arrayBuffer();
      }
    }

    if (interRegularFont && interBoldFont) {
      return [
        { name: 'Inter', data: interRegularFont, weight: 400, style: 'normal' },
        { name: 'Inter', data: interBoldFont, weight: 700, style: 'normal' },
      ];
    }
  } catch (error) {
    console.warn('Failed to load Inter fonts for slide, falling back to system sans-serif:', error);
  }
  return [];
}

/**
 * Calculates adaptive font size based on headline length.
 */
function getHeadlineFontSize(headline: string): number {
  if (headline.length > 90) return 46;
  if (headline.length > 60) return 52;
  return 60;
}

/**
 * Builds the URL for the code-rendered 1080x1350 PNG slide card.
 */
export function buildSlideOgImageUrl(data: SlideCardData): string {
  const params = new URLSearchParams({
    headline: data.headline || 'Slide Headline',
    take: data.take || '',
    slideNumber: String(data.slideNumber || 1),
    totalSlides: String(data.totalSlides || 1),
    handle: data.handle || '@regardless.ai',
  });

  return `/api/og/slide?${params.toString()}`;
}

/**
 * Parses query parameters from a slide OG image URL.
 */
export function parseSlideOgImageUrl(urlStr: string): SlideCardData | null {
  try {
    if (!urlStr.includes('/api/og/slide')) {
      return null;
    }
    const dummyBase = 'http://localhost';
    const parsedUrl = new URL(urlStr, dummyBase);
    const searchParams = parsedUrl.searchParams;

    return {
      headline: searchParams.get('headline') || 'Slide Headline',
      take: searchParams.get('take') || '',
      slideNumber: parseInt(searchParams.get('slideNumber') || '1', 10) || 1,
      totalSlides: parseInt(searchParams.get('totalSlides') || '1', 10) || 1,
      handle: searchParams.get('handle') || '@regardless.ai',
    };
  } catch {
    return null;
  }
}

/**
 * Generates the Satori JSX markup for the slide card.
 */
function createSlideElement(data: SlideCardData): React.ReactElement {
  const headlineFontSize = getHeadlineFontSize(data.headline);
  const handle = data.handle || '@regardless.ai';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '1080px',
        height: '1350px',
        backgroundColor: '#12141C',
        paddingTop: '56px',
        paddingBottom: '64px',
        paddingLeft: '64px',
        paddingRight: '64px',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #4A4472',
            borderRadius: '9999px',
            paddingTop: '8px',
            paddingBottom: '8px',
            paddingLeft: '20px',
            paddingRight: '20px',
          }}
        >
          <span style={{ color: '#B9B4F5', fontSize: '22px', fontWeight: 500, letterSpacing: '0.5px' }}>
            {data.slideNumber}/{data.totalSlides}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '85%',
          maxWidth: '85%',
          marginTop: 'auto',
          marginBottom: 'auto',
        }}
      >
        <div
          style={{
            color: '#F5F4FA',
            fontSize: `${headlineFontSize}px`,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.5px',
            wordBreak: 'break-word',
          }}
        >
          {data.headline}
        </div>
        <div
          style={{
            width: '64px',
            height: '5px',
            backgroundColor: '#8B7FE8',
            borderRadius: '3px',
            marginTop: '32px',
            marginBottom: '28px',
          }}
        />
        <div
          style={{
            color: '#9C98AE',
            fontSize: '32px',
            fontWeight: 400,
            lineHeight: 1.5,
            wordBreak: 'break-word',
          }}
        >
          {data.take}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
        <span style={{ color: '#6E6A82', fontSize: '24px', fontWeight: 400 }}>
          {handle}
        </span>
      </div>
    </div>
  );
}

/**
 * Renders the slide card as a Next.js ImageResponse.
 */
export async function renderSlideImageResponse(data: SlideCardData): Promise<ImageResponse> {
  const fonts = await loadFonts();
  return new ImageResponse(createSlideElement(data), {
    width: 1080,
    height: 1350,
    fonts: fonts.length > 0 ? fonts : undefined,
  });
}

/**
 * Renders the slide card directly into an in-memory PNG Buffer.
 */
export async function renderSlideImageBuffer(data: SlideCardData): Promise<Buffer> {
  const imageResponse = await renderSlideImageResponse(data);
  const arrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
