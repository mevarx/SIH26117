import { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  temperature: number;
  onChangeTemperature: (t: number) => void;
  role: 'user' | 'auditor' | 'admin';
  onChangeRole: (role: 'user' | 'auditor' | 'admin') => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  temperature,
  onChangeTemperature,
  role,
  onChangeRole,
}: SettingsModalProps) {
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [systemPrompt, setSystemPrompt] = useState(
    'You are Sovereign AI, an enterprise-grade sovereign intelligence assistant running strictly in an air-gapped, zero-telemetry local perimeter. Prioritize factual accuracy, mathematical determinism, and zero external egress.'
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Inference & Policy Settings"
      description="Configure model hyperparameters and role-based permissions."
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-4 text-xs">
        {/* Role Switcher */}
        <div className="flex flex-col gap-1.5">
          <label className="font-semibold text-[var(--text-primary)]">User Role / Policy</label>
          <div className="grid grid-cols-3 gap-2">
            {(['user', 'auditor', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onChangeRole(r)}
                className={`py-1.5 px-3 rounded-[var(--radius-sm)] border text-xs font-medium capitalize transition-colors cursor-pointer ${
                  role === r
                    ? 'bg-[var(--accent-muted)] border-[var(--accent-border)] text-[var(--accent)]'
                    : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Temperature */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[var(--text-muted)]">
            <span>Sampling Temperature</span>
            <span className="font-mono text-[var(--text-primary)]">{temperature.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.05"
            value={temperature}
            onChange={(e) => onChangeTemperature(parseFloat(e.target.value))}
            className="accent-[var(--accent)] cursor-pointer"
          />
        </div>

        {/* Top-P */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[var(--text-muted)]">
            <span>Nucleus Sampling (Top-P)</span>
            <span className="font-mono text-[var(--text-primary)]">{topP.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={topP}
            onChange={(e) => setTopP(parseFloat(e.target.value))}
            className="accent-[var(--accent)] cursor-pointer"
          />
        </div>

        {/* Max Tokens */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[var(--text-muted)]">
            <span>Context Limit</span>
            <span className="font-mono text-[var(--text-primary)]">{maxTokens} tokens</span>
          </div>
          <input
            type="range"
            min="1024"
            max="16384"
            step="1024"
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
            className="accent-[var(--accent)] cursor-pointer"
          />
        </div>

        {/* System Prompt */}
        <div className="flex flex-col gap-1.5">
          <label className="font-semibold text-[var(--text-primary)]">System Prompt</label>
          <textarea
            rows={3}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-2 rounded bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-medium)] resize-none"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border-subtle)]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button variant="accent" size="sm" onClick={onClose}>
            Save Changes
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
