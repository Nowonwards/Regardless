import React from 'react';

interface RegardlessMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Regardless Brand Mark
 * Minimal asterisk (3 radiating lines) crossed through with a bold diagonal slash,
 * symbolizing "regardless of the disclaimer / moving forward regardless".
 */
export function RegardlessMark({ size = 20, className = '', ...props }: RegardlessMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* 3 Radiating Asterisk Lines (stroke-based) */}
      <line
        x1="12"
        y1="4.5"
        x2="12"
        y2="19.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <line
        x1="5.5"
        y1="8.25"
        x2="18.5"
        y2="15.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />
      <line
        x1="5.5"
        y1="15.75"
        x2="18.5"
        y2="8.25"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Bold Diagonal Slash Crossing Through */}
      <line
        x1="4"
        y1="20"
        x2="20"
        y2="4"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
