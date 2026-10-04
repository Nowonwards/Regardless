'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-none border px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-wider transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'border-border bg-primary text-primary-foreground',
        secondary: 'border-border bg-secondary text-secondary-foreground',
        destructive: 'border-border bg-destructive text-destructive-foreground',
        outline: 'border-border bg-card text-foreground',
        drafted: 'border-border bg-muted text-muted-foreground',
        revision: 'border-border bg-highlight text-highlight-foreground',
        approved: 'border-border bg-accent text-accent-foreground',
        scheduled: 'border-border bg-primary text-primary-foreground',
        posted: 'border-border bg-foreground text-background',
        failed: 'border-border bg-destructive text-destructive-foreground',
        platform: 'border-border bg-card text-foreground',
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