'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground font-bold hover:opacity-90 active:bg-primary border border-primary',
        destructive: 'bg-destructive text-destructive-foreground font-bold hover:opacity-90 active:bg-destructive border border-destructive',
        outline: 'border border-border bg-transparent hover:bg-surface hover:text-foreground active:bg-surface',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-surface border border-border',
        ghost: 'hover:bg-surface hover:text-foreground active:bg-surface',
        link: 'text-primary underline-offset-4 hover:underline',
        platform: 'bg-surface text-foreground border border-border hover:bg-muted',
      },
      size: {
        default: 'h-10 px-4 py-2 gap-2',
        sm: 'h-9 px-3 gap-1.5',
        lg: 'h-11 px-8 gap-2',
        xl: 'h-12 px-10 gap-2',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
