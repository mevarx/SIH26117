import type { ReactNode } from 'react';
import { ChevronRight, GripVertical } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SheetProps {
  isOpen: boolean;
  onToggle: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  width?: number | string;
}

export function Sheet({
  isOpen,
  onToggle,
  title,
  children,
  className,
  width = 380,
}: SheetProps) {
  return (
    <>
      {/* Sliding Inspector Panel */}
      <div
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
        className={cn(
          'fixed right-0 top-12 bottom-0 z-30 flex flex-col bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] transition-transform duration-250 ease-out shadow-2xl',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
          <span className="text-xs font-semibold tracking-wide text-[var(--text-primary)]">
            {title || 'Inspector'}
          </span>
          <button
            onClick={onToggle}
            className="p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
            title="Collapse Inspector"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {children}
        </div>
      </div>

      {/* Vertical Edge Grip Handle when collapsed */}
      {!isOpen && (
        <button
          onClick={onToggle}
          title="Open Inspector Drawer"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center py-4 px-1 rounded-l-[var(--radius-md)] bg-[var(--bg-surface)] border-y border-l border-[var(--border-medium)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent-border)] transition-all cursor-pointer shadow-lg group"
        >
          <GripVertical size={14} className="group-hover:text-[var(--accent)] transition-colors" />
          <span className="[writing-mode:vertical-rl] text-[10px] font-medium tracking-wider mt-2 uppercase text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
            Inspector
          </span>
        </button>
      )}
    </>
  );
}
