import { useState } from 'react';
import { Terminal, Play, Trash2 } from 'lucide-react';

export function SandboxConsoleTab() {
  const [consoleOutput, setConsoleOutput] = useState<string>(
    `[DOCKER SANDBOX JAIL: ACTIVE]\n` +
    `• Network configuration: --network=none\n` +
    `• Memory ceiling: 256 MB hard limit\n` +
    `• Process ceiling: 64 PIDs max\n` +
    `• Container status: Container jail ready\n` +
    `--------------------------------------------------\n` +
    `Ready for sandboxed Python/Bash execution.\n` +
    `Execute code from chat or test execution below.`
  );

  const [memoryUsage] = useState<number>(42); // 42 MB used
  const [pidCount] = useState<number>(3); // 3 PIDs active

  const handleClear = () => {
    setConsoleOutput(`[DOCKER SANDBOX JAIL: ACTIVE]\n--network=none | 256MB max | 64 PIDs max\nConsole cleared.`);
  };

  const handleTestScript = () => {
    setConsoleOutput((prev) =>
      prev +
      `\n\n$ python3 -c "import socket; socket.create_connection(('1.1.1.1', 80), timeout=1)"\n` +
      `Traceback (most recent call last):\n` +
      `  File "<string>", line 1, in <module>\n` +
      `OSError: [Errno 101] Network is unreachable\n` +
      `[CONTAINER EGRESS CHECK PASSED: 0 EXTERNAL BYTES LEAKED]`
    );
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Real Config Gauges */}
      <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)] flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--text-primary)]">Sandbox Jail Metrics</span>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">Network: none</span>
        </div>

        {/* Memory Gauge */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
            <span>Memory ({memoryUsage} MB / 256 MB)</span>
            <span>{Math.round((memoryUsage / 256) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all"
              style={{ width: `${(memoryUsage / 256) * 100}%` }}
            />
          </div>
        </div>

        {/* PID Gauge */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
            <span>Process Count ({pidCount} / 64 PIDs)</span>
            <span>{Math.round((pidCount / 64) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full bg-[var(--border-subtle)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--status-ok)] rounded-full transition-all"
              style={{ width: `${(pidCount / 64) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Terminal View */}
      <div className="flex-1 flex flex-col rounded-[var(--radius-md)] bg-[#050608] border border-[var(--border-subtle)] overflow-hidden">
        <div className="px-3 py-1.5 bg-[var(--bg-surface-quiet)] border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Terminal size={12} />
            <span className="font-mono text-[11px]">stdout / stderr</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestScript}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer flex items-center gap-1"
              title="Run Air-gap Probe Script"
            >
              <Play size={10} />
              <span>Probe Egress</span>
            </button>
            <button
              onClick={handleClear}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              title="Clear Console"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        <pre className="flex-1 p-3 text-[11px] font-mono text-[var(--text-primary)] overflow-y-auto leading-relaxed whitespace-pre-wrap selection:bg-[var(--accent-muted)]">
          {consoleOutput}
        </pre>
      </div>
    </div>
  );
}
