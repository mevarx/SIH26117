import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'accent' | 'outline' | 'ghost' | 'quiet';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--border-medium)] disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer';

    const variants = {
      default: 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--border-medium)] border border-[var(--border-subtle)]',
      accent: 'bg-[var(--accent)] text-[#0A0B0D] font-semibold hover:brightness-110 shadow-sm',
      outline: 'border border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface)]',
      ghost: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]',
      quiet: 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-[var(--radius-sm)] gap-1.5',
      md: 'h-9 px-4 text-sm rounded-[var(--radius-md)] gap-2',
      lg: 'h-11 px-6 text-base rounded-[var(--radius-lg)] gap-2.5',
      icon: 'h-8 w-8 rounded-[var(--radius-md)] p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
