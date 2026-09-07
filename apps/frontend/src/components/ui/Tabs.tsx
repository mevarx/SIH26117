import React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  variant?: 'pill' | 'underline';
}

export function Tabs({ tabs, activeTab, onChange, className, variant = 'pill' }: TabsProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1',
        variant === 'pill'
          ? 'p-1 rounded-[var(--radius-md)] bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)]'
          : 'border-b border-[var(--border-subtle)] w-full gap-4 px-2',
        className
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        if (variant === 'underline') {
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 pb-2.5 pt-1 text-xs font-medium border-b-2 transition-colors cursor-pointer select-none',
                isActive
                  ? 'border-[var(--accent)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              {Icon && <Icon size={14} className={isActive ? 'text-[var(--accent)]' : 'text-current'} />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--border-subtle)] text-[var(--text-muted)]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-all cursor-pointer select-none',
              isActive
                ? 'bg-[var(--accent-muted)] text-[var(--text-primary)] border border-[var(--accent-border)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]'
            )}
          >
            {Icon && <Icon size={13} className={isActive ? 'text-[var(--accent)]' : 'text-current'} />}
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
