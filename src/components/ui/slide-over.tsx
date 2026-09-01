'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  width?: 'md' | 'lg' | 'xl' | 'full';
}

export function SlideOver({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  width = 'lg',
}: SlideOverProps) {
  // Handle Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const widthClasses = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    full: 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={cn(
            'w-screen transform transition-all duration-200 ease-out animate-in slide-in-from-right sm:duration-250',
            widthClasses[width]
          )}
        >
          <div className="flex h-full flex-col overflow-y-auto border-l border-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-surface/50">
              <div className="space-y-1 min-w-0 pr-4">
                {typeof title === 'string' ? (
                  <h2 className="text-base font-semibold text-foreground truncate">{title}</h2>
                ) : (
                  title
                )}
                {description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Body */}
            <div className={cn('relative flex-1 px-6 py-5 overflow-y-auto', className)}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-border/80 px-6 py-3.5 bg-surface/50 flex items-center justify-end gap-2">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
