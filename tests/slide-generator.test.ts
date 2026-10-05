/**
 * @jest-environment node
 */
import sharp from 'sharp';

jest.mock('next/og', () => {
  return {
    ImageResponse: jest.fn().mockImplementation(() => {
      return {
        arrayBuffer: async () => {
          const png = await sharp({
            create: {
              width: 1080,
              height: 1350,
              channels: 4,
              background: { r: 18, g: 20, b: 28, alpha: 1 },
            },
          })
            .png()
            .toBuffer();
          return png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength);
        },
      };
    }),
  };
});

import {
  buildSlideOgImageUrl,
  parseSlideOgImageUrl,
  renderSlideImageBuffer,
} from '@/lib/og/slide-generator';

describe('slide-generator utility', () => {
  it('builds relative OG image URL with query parameters', () => {
    // Arrange
    const data = {
      headline: 'AI in 2026',
      take: 'The future of open-weight intelligence',
      slideNumber: 2,
      totalSlides: 5,
      handle: '@regardless.ai',
    };

    // Act
    const url = buildSlideOgImageUrl(data);

    // Assert
    expect(url).toContain('/api/og/slide?');
    expect(url).toContain('headline=AI+in+2026');
    expect(url).toContain('slideNumber=2');
    expect(url).toContain('totalSlides=5');
  });

  it('parses relative slide OG image URL correctly', () => {
    // Arrange
    const url = '/api/og/slide?headline=Test+Title&take=Sample+take&slideNumber=3&totalSlides=7&handle=%40test';

    // Act
    const parsed = parseSlideOgImageUrl(url);

    // Assert
    expect(parsed).not.toBeNull();
    expect(parsed?.headline).toBe('Test Title');
    expect(parsed?.take).toBe('Sample take');
    expect(parsed?.slideNumber).toBe(3);
    expect(parsed?.totalSlides).toBe(7);
    expect(parsed?.handle).toBe('@test');
  });

  it('parses absolute Vercel deployment slide OG image URL correctly', () => {
    // Arrange
    const url =
      'https://regardless-git-develop-abhi0049ks-projects.vercel.app/api/og/slide?headline=Breaking+News&take=Insight&slideNumber=1&totalSlides=3';

    // Act
    const parsed = parseSlideOgImageUrl(url);

    // Assert
    expect(parsed).not.toBeNull();
    expect(parsed?.headline).toBe('Breaking News');
    expect(parsed?.slideNumber).toBe(1);
    expect(parsed?.totalSlides).toBe(3);
    expect(parsed?.handle).toBe('@regardless.ai');
  });

  it('returns null for non-slide URLs', () => {
    // Arrange
    const externalUrl = 'https://images.unsplash.com/photo-1234?auto=format';

    // Act
    const parsed = parseSlideOgImageUrl(externalUrl);

    // Assert
    expect(parsed).toBeNull();
  });

  it('renders a valid PNG buffer that sharp can process without glib XML errors', async () => {
    // Arrange
    const data = {
      headline: 'Clean Code in Modern Web',
      take: 'Building scalable social automation with React and Next.js',
      slideNumber: 1,
      totalSlides: 4,
      handle: '@regardless.ai',
    };

    // Act
    const buffer = await renderSlideImageBuffer(data);

    // Assert
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);

    // Verify sharp can read and convert this buffer without XML/glib parse errors
    const metadata = await sharp(buffer).metadata();
    expect(metadata.width).toBe(1080);
    expect(metadata.height).toBe(1350);

    const jpegBuffer = await sharp(buffer).jpeg().toBuffer();
    expect(jpegBuffer.length).toBeGreaterThan(0);
  });
});
