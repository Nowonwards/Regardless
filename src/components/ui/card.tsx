'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  'rounded-xl border bg-card text-card-foreground transition-shadow duration-200',
  {
    variants: {
      elevation: {
        none: 'border-border',
        low: 'border-border shadow-sm',
        default: 'border-border shadow-sm hover:shadow-md',
        raised: 'border-border shadow-md hover:shadow-lg',
      },
      padding: {
        none: '',
        default: 'p-6',
        compact: 'p-4',
        comfortable: 'p-8',
      },
    },
    defaultVariants: {
      elevation: 'default',
      padding: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  elevation?: 'none' | 'low' | 'default' | 'raised';
  padding?: 'none' | 'default' | 'compact' | 'comfortable';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ elevation, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5',
        padding === 'compact' && 'p-4',
        padding === 'default' && 'p-6',
        padding === 'comfortable' && 'p-8',
        padding === 'none' && '',
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-tight tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'pt-0',
        padding === 'compact' && 'p-4',
        padding === 'default' && 'p-6',
        padding === 'comfortable' && 'p-8',
        padding === 'none' && '',
        className
      )}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center pt-0',
        padding === 'compact' && 'p-4',
        padding === 'default' && 'p-6',
        padding === 'comfortable' && 'p-8',
        padding === 'none' && '',
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };