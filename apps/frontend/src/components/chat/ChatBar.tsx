import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Settings2,
  X,
  FileText,
} from 'lucide-react';
import { ModeSwitcher } from './ModeSwitcher';
import { AttachMenu } from './AttachMenu';
import { Popover } from '../ui/Popover';
import { TaskType, TaskAttachment } from '../../types/task';

interface ChatBarProps {
  currentMode: TaskType;
  onSelectMode: (mode: TaskType) => void;
  onSubmitPrompt: (prompt: string, attachment?: TaskAttachment) => void;
  onCancelStream: () => void;
  isStreaming: boolean;
  externalPrompt?: string;
  onClearExternalPrompt?: () => void;
  temperature: number;
  onChangeTemperature: (t: number) => void;
  sandboxEnforced: boolean;
  onToggleSandboxEnforced: (enforced: boolean) => void;
}

export function ChatBar({
  currentMode,
  onSelectMode,
  onSubmitPrompt,
  onCancelStream,
  isStreaming,
  externalPrompt,
  onClearExternalPrompt,
  temperature,
  onChangeTemperature,
  sandboxEnforced,
  onToggleSandboxEnforced,
}: ChatBarProps) {
  const [prompt, setPrompt] = useState('');
  const [attachment, setAttachment] = useState<TaskAttachment | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external prompt (e.g. from clicking suggested chips)
  useEffect(() => {
    if (externalPrompt) {
      setPrompt(externalPrompt);
      onClearExternalPrompt?.();
      textareaRef.current?.focus();
    }
  }, [externalPrompt, onClearExternalPrompt]);

  // Dynamic placeholder per PRD Section 4.5
  const placeholders: Record<TaskType, string> = {
    general: 'Enter a prompt or question for local sovereign reasoning...',
    rag: 'Ask a question across indexed documents or attach a new file...',
    agent: 'Describe a multi-step objective for autonomous tool execution...',
    sandbox: 'Describe the Python/Bash code you want executed in the container jail...',
  };

  // Auto-grow textarea up to 180px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() && !attachment) return;
    if (isStreaming) return;

    onSubmitPrompt(prompt, attachment);
    setPrompt('');
    setAttachment(undefined);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full border-t border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3 shrink-0 select-none">
      <div className="mx-auto w-full max-w-3xl flex flex-col gap-2">
        {/* Removable Attached File Chip per PRD Section 4.5 */}
        {attachment && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] w-fit animate-in fade-in-50">
            <FileText size={13} className="text-[var(--accent)] shrink-0" />
            <span className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">
              {attachment.filename}
            </span>
            <span className="text-[10px]">({Math.round(attachment.fileSize / 1024)} KB)</span>
            {attachment.ocrApplied && (
              <span className="text-[10px] px-1 py-0.2 rounded bg-[var(--accent-muted)] text-[var(--accent)] font-semibold">
                OCR Applied
              </span>
            )}
            <button
              onClick={() => setAttachment(undefined)}
              className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer ml-1"
              title="Remove attachment"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Primary Composer Surface */}
        <div className="flex flex-col rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus-within:border-[var(--border-medium)] transition-colors p-2 shadow-sm">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholders[currentMode]}
            className="w-full bg-transparent resize-none text-[13.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-2 py-1.5 focus:outline-none leading-relaxed font-sans"
          />

          {/* Controls Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] px-1 mt-1">
            {/* Left Controls: Mode Switcher + Session Settings Gear + Pin Attach */}
            <div className="flex items-center gap-2">
              {/* Claude-style Mode Switcher */}
              <ModeSwitcher
                currentMode={currentMode}
                onSelectMode={onSelectMode}
              />

              {/* Session Settings Popover Gear icon per PRD Section 4.5 */}
              <Popover
                align="start"
                side="top"
                className="w-64 p-3"
                trigger={
                  <button
                    type="button"
                    title="Session Settings (Temperature & Sandbox)"
                    className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer select-none"
                  >
                    <Settings2 size={15} />
                  </button>
                }
              >
                <div className="flex flex-col gap-3 text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">Session Controls</span>

                  {/* Temperature slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
                      <span>Temperature</span>
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

                  {/* Sandbox Enforcement Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                    <div className="flex flex-col">
                      <span className="font-medium text-[var(--text-primary)]">Docker Jail</span>
                      <span className="text-[10px] text-[var(--text-muted)]">--network=none (256MB)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={sandboxEnforced}
                      onChange={(e) => onToggleSandboxEnforced(e.target.checked)}
                      className="accent-[var(--accent)] h-4 w-4 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </Popover>

              {/* Attach Control ("Pin") */}
              <AttachMenu
                onAttachFile={(att) => setAttachment(att)}
                isUploading={false}
              />
            </div>

            {/* Right: Send / Stop Button per PRD Section 4.5 */}
            <div className="flex items-center">
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onCancelStream}
                  title="Stop generating"
                  className="h-7 w-7 rounded-[var(--radius-md)] bg-[var(--bg-surface-quiet)] border border-[var(--border-medium)] flex items-center justify-center text-[var(--status-error)] hover:bg-[rgba(var(--status-error-rgb),0.1)] transition-colors cursor-pointer select-none"
                >
                  <Square size={13} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={!prompt.trim() && !attachment}
                  title="Send message"
                  className="h-7 px-3 rounded-[var(--radius-md)] bg-[var(--accent)] text-[#0A0B0D] font-semibold flex items-center justify-center gap-1.5 text-xs hover:brightness-110 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer select-none"
                >
                  <span>Send</span>
                  <Send size={11} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
