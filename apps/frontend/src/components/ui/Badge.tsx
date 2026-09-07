import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'ok' | 'warn' | 'error' | 'neutral' | 'accent';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const variants = {
    ok: 'bg-[rgba(var(--status-ok-rgb),0.12)] text-[var(--status-ok)] border-[rgba(var(--status-ok-rgb),0.25)]',
    warn: 'bg-[rgba(var(--status-warn-rgb),0.12)] text-[var(--status-warn)] border-[rgba(var(--status-warn-rgb),0.25)]',
    error: 'bg-[rgba(var(--status-error-rgb),0.12)] text-[var(--status-error)] border-[rgba(var(--status-error-rgb),0.25)]',
    neutral: 'bg-[var(--border-subtle)] text-[var(--text-muted)] border-[var(--border-subtle)]',
    accent: 'bg-[var(--accent-muted)] text-[var(--accent)] border-[var(--accent-border)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-[var(--radius-sm)] border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
