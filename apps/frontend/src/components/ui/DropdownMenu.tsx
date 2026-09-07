import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
}

export function DropdownMenu({
  trigger,
  items,
  className,
  align = 'start',
  side = 'bottom',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 min-w-[180px] rounded-[var(--radius-md)] bg-[var(--bg-surface)] p-1.5 shadow-2xl border border-[var(--border-medium)]',
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            align === 'end' ? 'right-0' : 'left-0',
            className
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs text-left rounded-[var(--radius-sm)] transition-colors',
                  item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'text-[var(--text-primary)] hover:bg-[var(--border-subtle)] hover:text-[var(--text-primary)] cursor-pointer'
                )}
              >
                {Icon && <Icon size={14} className="text-[var(--text-muted)] shrink-0" />}
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="font-medium truncate">{item.label}</span>
                  {item.description && (
                    <span className="text-[10px] text-[var(--text-muted)] truncate">{item.description}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
