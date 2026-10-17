import React from 'react';
import Link from 'next/link';

interface LandingLogoProps {
  showWordmark?: boolean;
  className?: string;
  href?: string;
}

export function LandingLogo({
  showWordmark = true,
  className = '',
  href = '#top',
}: LandingLogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* 40x40 ink square, 2.5px inset white border, 11.5px orange corner block, white R */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 border-2 border-ink"
        aria-hidden="true"
      >
        {/* Ink square background */}
        <rect width="40" height="40" fill="#111111" />
        {/* 2.5px inset white border */}
        <rect
          x="1.25"
          y="1.25"
          width="37.5"
          height="37.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
        />
        {/* 11.5px orange block in bottom-right corner */}
        <rect x="28.5" y="28.5" width="11.5" height="11.5" fill="#FF5A1F" />
        {/* White "R" in Archivo 900 */}
        <text
          x="19"
          y="27"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="var(--font-sans), sans-serif"
          fontWeight="900"
          fontSize="22"
          className="select-none"
        >
          R
        </text>
      </svg>
      {showWordmark && (
        <span className="font-sans font-black text-2xl tracking-[-0.03em] text-ink leading-none">
          Regardless
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
        aria-label="Regardless Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
