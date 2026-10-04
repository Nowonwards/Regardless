'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-none text-xs font-mono font-bold uppercase tracking-wider transition-all duration-100 focus-visible:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:opacity-50 select-none border',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border-foreground shadow-[4px_4px_0_0_var(--border)] hover:bg-primary active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--border)]',
        destructive:
          'bg-destructive text-destructive-foreground border-foreground shadow-[4px_4px_0_0_var(--border)] hover:opacity-90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--border)]',
        outline:
          'border-border bg-card text-foreground shadow-[4px_4px_0_0_var(--border)] hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--border)]',
        secondary:
          'bg-secondary text-secondary-foreground border-border shadow-[4px_4px_0_0_var(--border)] hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--border)]',
        ghost:
          'border-transparent bg-transparent hover:border-border hover:bg-card text-foreground shadow-none',
        link:
          'text-accent underline-offset-4 hover:underline border-transparent bg-transparent shadow-none',
        platform:
          'bg-card text-foreground border-border shadow-[4px_4px_0_0_var(--border)] hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--border)]',
      },
      size: {
        default: 'h-10 px-4 py-2 gap-2',
        sm: 'h-8 px-3 gap-1.5 text-[11px]',
        lg: 'h-11 px-6 gap-2 text-sm',
        xl: 'h-12 px-8 gap-2.5 text-sm',
        icon: 'h-9 w-9 p-0',
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
