import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AccordionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  className?: string;
}

export function Accordion({
  title,
  defaultOpen = false,
  children,
  icon: Icon,
  badge,
  className,
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface-quiet)] overflow-hidden transition-all',
        className
      )}
    >
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <ChevronRight
            size={13}
            className={cn('transition-transform duration-200 shrink-0', isOpen && 'rotate-90 text-[var(--accent)]')}
          />
          {Icon && <Icon size={13} className="shrink-0 text-[var(--text-muted)]" />}
          <span className="font-medium truncate">{title}</span>
        </div>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border-subtle)] text-[var(--text-muted)] shrink-0">
            {badge}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 text-xs border-t border-[var(--border-subtle)] text-[var(--text-muted)] leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}
