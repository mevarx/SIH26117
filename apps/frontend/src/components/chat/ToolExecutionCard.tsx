import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench } from 'lucide-react';
import { ToolCall } from '../../types/task';
import { Badge } from '../ui/Badge';

interface ToolExecutionCardProps {
  tool: ToolCall;
  onOpenSandbox?: () => void;
}

export function ToolExecutionCard({ tool, onOpenSandbox }: ToolExecutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFailed = tool.status === 'failed' || !!tool.error;

  return (
    <div className="my-2 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden text-xs">
      {/* Tool Header */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="px-3 py-2 flex items-center justify-between hover:bg-[var(--border-subtle)] transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? <ChevronDown size={13} className="text-[var(--text-muted)]" /> : <ChevronRight size={13} className="text-[var(--text-muted)]" />}
          <Wrench size={13} className="text-[var(--accent)]" />
          <span className="font-semibold text-[var(--text-primary)]">{tool.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {isFailed ? (
            <Badge variant="error">Failed</Badge>
          ) : (
            <Badge variant="ok">Executed</Badge>
          )}

          {tool.name === 'docker_runner' && onOpenSandbox && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenSandbox();
              }}
              className="text-[10px] text-[var(--accent)] hover:underline font-mono"
            >
              [View Sandbox]
            </button>
          )}
        </div>
      </div>

      {/* Expandable Parameters & Output */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--border-subtle)] flex flex-col gap-2 font-mono text-[11px]">
          {tool.params && Object.keys(tool.params).length > 0 && (
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                Input Parameters
              </span>
              <pre className="p-2 rounded bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)] text-[var(--text-muted)] overflow-x-auto">
                {JSON.stringify(tool.params, null, 2)}
              </pre>
            </div>
          )}

          {(tool.result || tool.error) && (
            <div>
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                {isFailed ? 'Execution Failure (stderr)' : 'Execution Result (stdout)'}
              </span>
              <pre
                className={`p-2 rounded border overflow-x-auto leading-relaxed ${
                  isFailed
                    ? 'bg-[rgba(var(--status-error-rgb),0.06)] border-[rgba(var(--status-error-rgb),0.2)] text-[var(--status-error)]'
                    : 'bg-[var(--bg-surface-quiet)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                }`}
              >
                {typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result || tool.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
