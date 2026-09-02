'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-none border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground',
        secondary: 'border-border bg-surface text-foreground',
        destructive: 'border-destructive bg-destructive text-black',
        outline: 'border-border bg-transparent text-foreground',
        success: 'border-green-600 bg-green-500 text-black',
        warning: 'border-amber-600 bg-amber-500 text-black',
        platform: 'border-border bg-surface text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };