import { useState } from 'react';
import { Shield, Plus, SlidersHorizontal, Edit2, Check } from 'lucide-react';
import { EndpointStatus } from './EndpointStatus';
import { Button } from '../ui/Button';

interface TopBarProps {
  sessionName: string;
  onRenameSession: (name: string) => void;
  onNewSession: () => void;
  onOpenSettings: () => void;
  onReturnToHero?: () => void;
}

export function TopBar({
  sessionName,
  onRenameSession,
  onNewSession,
  onOpenSettings,
  onReturnToHero,
}: TopBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(sessionName);

  const handleSave = () => {
    if (tempName.trim()) {
      onRenameSession(tempName.trim());
    }
    setIsEditing(false);
  };

  return (
    <header className="h-12 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 flex items-center justify-between z-20 shrink-0 select-none">
      {/* Left: Endpoint status indicator with popover */}
      <div className="flex items-center gap-4">
        <EndpointStatus />

        <div className="h-4 w-px bg-[var(--border-subtle)]" />

        {/* Center-left: Brand mark + Session Name (editable inline) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onReturnToHero}
            title={onReturnToHero ? "Return to Hero Overview" : undefined}
            className="flex items-center justify-center h-6 w-6 rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent-border)] transition-colors cursor-pointer"
          >
            <Shield size={13} />
          </button>

          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') {
                    setTempName(sessionName);
                    setIsEditing(false);
                  }
                }}
                autoFocus
                className="h-6 px-2 text-xs bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                onClick={handleSave}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <Check size={12} />
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                setTempName(sessionName);
                setIsEditing(true);
              }}
              className="group flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[var(--border-subtle)] cursor-pointer transition-colors"
            >
              <span className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[200px]">
                {sessionName}
              </span>
              <Edit2
                size={11}
                className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: New Session button & Settings modal trigger */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onNewSession}
          className="h-7 text-xs px-2.5 gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <Plus size={13} />
          <span>New Session</span>
        </Button>

        <button
          onClick={onOpenSettings}
          title="Inference & Policy Settings"
          className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-medium)] transition-colors cursor-pointer"
        >
          <SlidersHorizontal size={13} />
        </button>
      </div>
    </header>
  );
}
