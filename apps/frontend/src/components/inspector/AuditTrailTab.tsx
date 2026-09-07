import { useState } from 'react';
import { Search, RefreshCw, Copy, Check } from 'lucide-react';
import { useAuditLogs } from '../../hooks/useAuditLogs';

export function AuditTrailTab() {
  const { logs, isLoading, refetch } = useAuditLogs(30);
  const [filter, setFilter] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      log.event_type.toLowerCase().includes(q) ||
      log.actor.toLowerCase().includes(q) ||
      log.sha256_hash.toLowerCase().includes(q)
    );
  });

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Search & Refresh */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Filter audit events or hashes..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full h-7 pl-7 pr-2 text-xs bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-medium)]"
          />
        </div>

        <button
          onClick={() => refetch()}
          className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-quiet)] transition-colors cursor-pointer"
          title="Refresh Audit Trail"
        >
          <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
        {filteredLogs.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-6">
            No audit records match the search criteria.
          </p>
        ) : (
          filteredLogs.map((log, idx) => {
            const isHashCopied = copiedHash === log.sha256_hash;
            return (
              <div
                key={idx}
                className="p-2.5 rounded-[var(--radius-md)] bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)] flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)] text-[11px]">
                    {log.event_type}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>Actor: <strong className="text-[var(--text-primary)]">{log.actor}</strong></span>
                  <span>{log.action}</span>
                </div>

                {/* SHA-256 Hash */}
                <div className="mt-1 pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)]">
                  <span className="truncate max-w-[240px]">
                    {log.sha256_hash}
                  </span>
                  <button
                    onClick={() => handleCopy(log.sha256_hash)}
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors cursor-pointer"
                    title="Copy SHA-256"
                  >
                    {isHashCopied ? <Check size={11} className="text-[var(--status-ok)]" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-[10px] text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)] flex justify-between">
        <span>Append-only verification: SHA-256</span>
        <span>Entries: {filteredLogs.length}</span>
      </div>
    </div>
  );
}
