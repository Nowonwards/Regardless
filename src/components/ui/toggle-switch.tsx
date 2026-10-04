'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export interface ToggleProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> {
  label?: string;
}

export const Toggle = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  ToggleProps
>(({ className, checked, defaultChecked, ...props }, ref) => {
  return (
    <SwitchPrimitives.Root
      ref={ref}
      checked={checked}
      defaultChecked={defaultChecked}
      className={cn(
        'group relative inline-flex h-[30px] w-[62px] min-w-[62px] shrink-0 cursor-pointer items-center rounded-none border-2 border-border p-0 transition-colors select-none',
        'bg-card data-[state=checked]:bg-[#1F3DFF]',
        'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[3px] focus-visible:outline-solid',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {/* ON Label (shown on left when checked) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-2 text-[10px] font-mono font-bold leading-none text-white opacity-0 transition-opacity duration-100 group-data-[state=checked]:opacity-100 select-none"
      >
        ON
      </span>

      {/* OFF Label (shown on right when unchecked) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-2 text-[10px] font-mono font-bold leading-none text-muted-foreground opacity-100 transition-opacity duration-100 group-data-[state=checked]:opacity-0 select-none"
      >
        OFF
      </span>

      {/* Sliding Knob */}
      <SwitchPrimitives.Thumb
        className={cn(
          'pointer-events-none block h-[22px] w-[22px] rounded-none transition-transform duration-100 ease-out motion-reduce:transition-none',
          // OFF state: 2px from left, ink background
          'translate-x-[2px] bg-foreground',
          // ON state: 32px slide (2px inset from right), white background with 2px ink ring
          'data-[state=checked]:translate-x-[34px] data-[state=checked]:bg-white data-[state=checked]:border-2 data-[state=checked]:border-[#0B0B0C]'
        )}
      />
    </SwitchPrimitives.Root>
  );
});

Toggle.displayName = 'Toggle';

export const Switch = Toggle;
