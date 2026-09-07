import { useState } from 'react';
import { Search, FileText } from 'lucide-react';
import { RetrievedChunk } from '../../types/knowledge';

export function RagInspectorTab() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<RetrievedChunk[]>([
    {
      source: 'defense_specs_v4.pdf',
      content: 'Section 4.1.2: Cryptographic key generation requires local entropy validation. No external seed requests may traverse network interfaces.',
      dense_score: 0.89,
      sparse_score: 0.84,
      combined_score: 0.87,
      metadata: { page: 12 },
    },
    {
      source: 'airgap_policy_standard.docx',
      content: 'Rule 19: Any containerized agent tool invoking TCP/UDP connections beyond 127.0.0.1 must be immediately terminated and logged to data/audit.jsonl.',
      dense_score: 0.82,
      sparse_score: 0.91,
      combined_score: 0.86,
      metadata: { page: 3 },
    },
  ]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch('/api/knowledge/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, top_k: 5 }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setResults(json.data);
        }
      }
    } catch {
      // Standby
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Hybrid Search Tester */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-[var(--text-primary)]">
          Hybrid RAG Query Tester
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Test dense + BM25 keyword query..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full h-7 pl-7 pr-2 text-xs bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-medium)]"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="h-7 px-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            {isSearching ? '...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Retrieved Chunks with Score Breakdown */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
        <span className="text-[11px] font-medium text-[var(--text-muted)]">
          Retrieved Chunks ({results.length})
        </span>

        {results.map((chunk, idx) => (
          <div
            key={idx}
            className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)] flex flex-col gap-2 text-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[var(--text-primary)] font-medium">
                <FileText size={12} className="text-[var(--text-muted)] shrink-0" />
                <span className="truncate max-w-[180px]">{chunk.source}</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--accent)] font-semibold">
                RRF: {Math.round(chunk.combined_score * 100)}%
              </span>
            </div>

            <p className="text-xs text-[var(--text-primary)] leading-relaxed bg-[var(--bg-base)] p-2 rounded border border-[var(--border-subtle)]">
              "{chunk.content}"
            </p>

            {/* Score Breakdown: Dense vs Sparse */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)]">
              <div>
                Dense Vector: <strong className="text-[var(--text-primary)]">{Math.round((chunk.dense_score || 0.8) * 100)}%</strong>
              </div>
              <div>
                BM25 Sparse: <strong className="text-[var(--text-primary)]">{Math.round((chunk.sparse_score || 0.85) * 100)}%</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
