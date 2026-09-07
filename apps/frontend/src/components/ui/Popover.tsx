import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom';
}

export function Popover({
  trigger,
  children,
  className,
  align = 'start',
  side = 'bottom',
}: PopoverProps) {
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

  const alignStyles = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 min-w-[240px] rounded-[var(--radius-lg)] bg-[var(--bg-surface)] p-3 text-[var(--text-primary)] shadow-2xl border border-[var(--border-medium)] animate-in fade-in-50 zoom-in-95',
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            alignStyles[align],
            className
          )}
        >
          {typeof children === 'function' ? (children as any)({ close: () => setIsOpen(false) }) : children}
        </div>
      )}
    </div>
  );
}
