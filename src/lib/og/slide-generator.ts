export interface SlideCardData {
  headline: string;
  take: string;
  slideNumber: number;
  totalSlides: number;
  handle?: string;
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
