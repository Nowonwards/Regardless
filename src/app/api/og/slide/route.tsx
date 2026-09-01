import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Cache font buffer in memory across invocations
let interRegularFont: ArrayBuffer | null = null;
let interBoldFont: ArrayBuffer | null = null;

async function loadFonts() {
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
  return { interRegularFont, interBoldFont };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const headline = searchParams.get('headline') || 'The Open-Weight AI Lobby';
    const take = searchParams.get('take') || 'Meta, Microsoft, and Nvidia are lobbying the US government for Open-Weight AI. But is it altruism... or a power move?';
    const slideNumber = searchParams.get('slideNumber') || '1';
    const totalSlides = searchParams.get('totalSlides') || '6';
    const handle = searchParams.get('handle') || '@regardless.ai';

    // Auto-shrink headline font size for long text so it never overflows
    let headlineFontSize = 60;
    if (headline.length > 90) {
      headlineFontSize = 46;
    } else if (headline.length > 60) {
      headlineFontSize = 52;
    }

    let fonts: any[] = [];
    try {
      const { interRegularFont, interBoldFont } = await loadFonts();
      if (interRegularFont && interBoldFont) {
        fonts = [
          {
            name: 'Inter',
            data: interRegularFont,
            weight: 400,
            style: 'normal',
          },
          {
            name: 'Inter',
            data: interBoldFont,
            weight: 700,
            style: 'normal',
          },
        ];
      }
    } catch (fontErr) {
      console.warn('Failed to load external Inter font, falling back to system sans-serif:', fontErr);
    }

    return new ImageResponse(
      (
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
          {/* Header with Counter Badge (Top Right) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              width: '100%',
            }}
          >
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
              <span
                style={{
                  color: '#B9B4F5',
                  fontSize: '22px',
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                }}
              >
                {slideNumber}/{totalSlides}
              </span>
            </div>
          </div>

          {/* Content Block (Vertically Centered in middle two-thirds) */}
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
            {/* Headline */}
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
              {headline}
            </div>

            {/* Accent Divider */}
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

            {/* Take / Insight Line */}
            <div
              style={{
                color: '#9C98AE',
                fontSize: '32px',
                fontWeight: 400,
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
            >
              {take}
            </div>
          </div>

          {/* Footer with Dynamic Handle (Bottom Left) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              width: '100%',
            }}
          >
            <span
              style={{
                color: '#6E6A82',
                fontSize: '24px',
                fontWeight: 400,
              }}
            >
              {handle}
            </span>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1350,
        fonts: fonts.length > 0 ? fonts : undefined,
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    return new Response('Failed to generate slide image', { status: 500 });
  }
}
