import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}

export function Logo({
  size = 28,
  showWordmark = true,
  className,
  markClassName,
  wordmarkClassName,
}: LogoProps) {
  return (
    <div className={cn('inline-flex items-center gap-2.5 select-none text-foreground', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('shrink-0 border border-white bg-[#0B0B0C]', markClassName)}
        aria-hidden="true"
      >
        {/* Solid ink square background */}
        <rect width="32" height="32" fill="#0B0B0C" />
        {/* Primary square notch in top-right corner */}
        <rect x="25" y="0" width="7" height="7" fill="var(--primary, #FF4B1F)" />
        {/* Geometric R in paper white (always crisp and visible against ink background) */}
        <rect x="6" y="6" width="4.5" height="20" fill="#F4F1EA" />
        <rect x="10.5" y="6" width="10" height="3.5" fill="#F4F1EA" />
        <rect x="17" y="6" width="3.5" height="10.5" fill="#F4F1EA" />
        <rect x="10.5" y="13" width="10" height="3.5" fill="#F4F1EA" />
        <polygon points="12,16 16.5,16 22,26 17.2,26" fill="#F4F1EA" />
      </svg>
      {showWordmark && (
        <span
          className={cn(
            'font-sans font-extrabold uppercase tracking-tight text-foreground text-lg leading-none',
            wordmarkClassName
          )}
        >
          REGARDLESS
        </span>
      )}
    </div>
  );
}
