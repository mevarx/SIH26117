import { useState } from 'react';
import { Copy, Check, Play } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  code: string;
  onRunInSandbox?: (code: string) => void;
}

export function CodeBlock({ language = 'python', code, onRunInSandbox }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-[var(--radius-md)] bg-[#050608] border border-[var(--border-subtle)] overflow-hidden font-mono text-xs">
      {/* Code Header Bar */}
      <div className="px-3 py-1.5 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between">
        <span className="text-[11px] text-[var(--text-muted)] lowercase">{language}</span>

        <div className="flex items-center gap-2">
          {onRunInSandbox && (
            <button
              onClick={() => onRunInSandbox(code)}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[var(--accent)] hover:bg-[var(--accent-muted)] transition-colors cursor-pointer"
              title="Execute inside Docker Jail (--network=none)"
            >
              <Play size={10} />
              <span>Run in Sandbox</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title="Copy code"
          >
            {copied ? <Check size={11} className="text-[var(--status-ok)]" /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code body */}
      <pre className="p-3.5 overflow-x-auto text-[var(--text-primary)] leading-relaxed selection:bg-[var(--accent-muted)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
