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
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

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
      {/* Backdrop without blur */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity duration-100 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={cn(
            'w-screen transform transition-all duration-150 ease-out animate-in slide-in-from-right',
            widthClasses[width]
          )}
        >
          <div className="flex h-full flex-col overflow-y-auto border-l border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-card">
              <div className="space-y-1 min-w-0 pr-4">
                {typeof title === 'string' ? (
                  <h2 className="text-base font-extrabold text-foreground truncate">{title}</h2>
                ) : (
                  title
                )}
                {description && (
                  <p className="text-xs font-mono text-muted-foreground line-clamp-1">{description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-none border border-border text-muted-foreground hover:text-foreground shrink-0"
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
              <div className="border-t border-border px-6 py-3.5 bg-card flex items-center justify-end gap-2">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
