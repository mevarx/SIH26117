import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Database, Layers, Terminal, Check } from 'lucide-react';
import { TaskType } from '../../types/task';

interface ModeSwitcherProps {
  currentMode: TaskType;
  onSelectMode: (mode: TaskType) => void;
}

interface ModeOption {
  id: TaskType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const MODES: ModeOption[] = [
  {
    id: 'general',
    label: 'General Chat',
    description: 'Deterministic local LLM reasoning',
    icon: Sparkles,
  },
  {
    id: 'rag',
    label: 'Document RAG',
    description: 'Hybrid vector & keyword document search',
    icon: Database,
  },
  {
    id: 'agent',
    label: 'Autonomous Agent',
    description: 'Multi-step state graph & tool loops',
    icon: Layers,
  },
  {
    id: 'sandbox',
    label: 'Docker Sandbox',
    description: 'Isolated Python/Bash container execution',
    icon: Terminal,
  },
];

export function ModeSwitcher({ currentMode, onSelectMode }: ModeSwitcherProps) {
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

  const activeOption = MODES.find((m) => m.id === currentMode) || MODES[0];
  const ActiveIcon = activeOption.icon;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button - Claude-style composer pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-md)] bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer select-none"
        title="Switch Execution Mode"
      >
        <ActiveIcon size={13} className="text-[var(--accent)] shrink-0" />
        <span className="font-medium truncate">{activeOption.label}</span>
        <ChevronDown size={11} className="text-[var(--text-muted)] shrink-0" />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-64 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-medium)] p-1.5 shadow-2xl z-40 animate-in fade-in-0 zoom-in-95">
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Execution Mode
          </div>

          <div className="flex flex-col gap-0.5">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = mode.id === currentMode;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    onSelectMode(mode.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 px-2 py-2 rounded-[var(--radius-md)] text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent-muted)] text-[var(--text-primary)]'
                      : 'hover:bg-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon
                    size={14}
                    className={`mt-0.5 shrink-0 ${isSelected ? 'text-[var(--accent)]' : 'text-current'}`}
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--text-primary)]">
                        {mode.label}
                      </span>
                      {isSelected && <Check size={12} className="text-[var(--accent)] shrink-0" />}
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                      {mode.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
