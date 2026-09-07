import { useState } from 'react';
import { Search, FileText, Layers, Copy, Check, Info } from 'lucide-react';
import { RetrievedChunk } from '../../types/knowledge';

interface CitationsTabProps {
  initialCitations?: RetrievedChunk[];
}

const DEFAULT_CHUNKS: RetrievedChunk[] = [
  {
    source: 'defense_specs_v4.pdf',
    text: 'Section 4.1.2: Cryptographic key generation requires local entropy validation. No external seed requests may traverse network interfaces or unencrypted bus channels.',
    vector_score: 0.892,
    bm25_score: 18.45,
    score: 0.0328,
    page: 12,
    chunk_index: 3,
  },
  {
    source: 'airgap_policy_standard.docx',
    text: 'Rule 19: Containerized agent tools invoking TCP/UDP sockets beyond 127.0.0.1 must be immediately terminated and logged to data/audit.jsonl with Ed25519 tamper-evident signatures.',
    vector_score: 0.814,
    bm25_score: 22.10,
    score: 0.0319,
    page: 3,
    chunk_index: 1,
  },
  {
    source: 'cryptographic_audit_spec.pdf',
    text: 'Section 7: Append-only JSONL files shall verify Ed25519 digital signatures on every event entry prior to compliance certificate generation.',
    vector_score: 0.765,
    bm25_score: 14.80,
    score: 0.0295,
    page: 8,
    chunk_index: 6,
  },
];

export function CitationsTab({ initialCitations }: CitationsTabProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<RetrievedChunk[]>(initialCitations || DEFAULT_CHUNKS);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

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
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setResults(json.data);
        }
      }
    } catch {
      // Fallback stays in place
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden text-xs text-[var(--text-primary)]">
      {/* Glass Box RAG Header Banner */}
      <div className="p-2.5 rounded-[var(--radius-md)] bg-white/[0.03] border border-white/10 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <Layers size={13} className="text-[var(--accent)]" />
            <span>Glass Box RAG Citations</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent-border)] font-medium">
            RRF k=60 Fusion
          </span>
        </div>
        <p className="text-[11px] text-white/60 leading-relaxed">
          Transparent multi-stage retrieval inspecting dense semantic similarity, sparse BM25 keyword frequency, and reciprocal rank fusion scores.
        </p>
      </div>

      {/* Query Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Inspect vector & BM25 retrieval for query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full h-8 pl-7 pr-2 text-xs bg-[#0E0F17] border border-white/10 rounded-[var(--radius-sm)] text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="h-8 px-3 rounded-[var(--radius-sm)] bg-[#141622] hover:bg-[#1A1D2D] border border-white/10 text-xs font-medium text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSearching ? '...' : 'Query'}
        </button>
      </div>

      {/* Citations List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        <div className="flex items-center justify-between text-[11px] text-white/50 px-0.5">
          <span>Ranked Evidence Chunks ({results.length})</span>
          <span className="flex items-center gap-1 text-[10px]">
            <Info size={11} />
            Dense + BM25 Combined
          </span>
        </div>

        {results.map((chunk, idx) => {
          const chunkText = chunk.text || chunk.content || '';
          const vecScore = chunk.vector_score ?? chunk.dense_score ?? 0.8;
          const bm25Score = chunk.bm25_score ?? chunk.sparse_score ?? 15.0;
          const rrfScore = chunk.score ?? chunk.combined_score ?? 0.03;

          // Normalized percentages for bar visual representation
          const vecPct = Math.min(Math.round(vecScore * 100), 100);
          const bm25Pct = Math.min(Math.round((bm25Score / 25) * 100), 100);
          const rrfFormatted = rrfScore < 0.1 ? rrfScore.toFixed(4) : `${(rrfScore * 100).toFixed(1)}%`;

          return (
            <div
              key={idx}
              className="p-3 rounded-[var(--radius-md)] bg-[#0A0B12] border border-white/10 hover:border-white/20 transition-all flex flex-col gap-2.5 shadow-sm group"
            >
              {/* Card Header: Source & RRF Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-white font-medium min-w-0">
                  <FileText size={13} className="text-[var(--accent)] shrink-0" />
                  <span className="truncate font-semibold text-xs">{chunk.source}</span>
                  {chunk.page && (
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/5 text-white/60 border border-white/10 shrink-0">
                      p.{chunk.page}
                    </span>
                  )}
                  {chunk.chunk_index !== undefined && (
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/5 text-white/60 border border-white/10 shrink-0">
                      #{chunk.chunk_index}
                    </span>
                  )}
                </div>

                {/* Final RRF Score Badge */}
                <div className="flex items-center gap-1 shrink-0 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent-border)]">
                  <span>RRF:</span>
                  <span>{rrfFormatted}</span>
                </div>
              </div>

              {/* Chunk Text Preview */}
              <div className="relative p-2.5 rounded bg-[#05060A] border border-white/5 text-white/90 text-[12px] leading-relaxed">
                <p className="line-clamp-4 font-normal">"{chunkText}"</p>
                <button
                  onClick={() => handleCopy(chunkText, idx)}
                  className="absolute top-2 right-2 p-1 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors cursor-pointer"
                  title="Copy Chunk Text"
                >
                  {copiedIdx === idx ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                </button>
              </div>

              {/* Glass Box Score Breakdown */}
              <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
                <span className="text-[10px] font-semibold text-white/50 tracking-wider uppercase">
                  Glass Box Score Breakdown
                </span>

                {/* Vector Similarity Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/70 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                      Vector Similarity (Dense)
                    </span>
                    <span className="font-mono text-cyan-300 font-semibold">{vecScore.toFixed(3)} ({vecPct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500"
                      style={{ width: `${vecPct}%` }}
                    />
                  </div>
                </div>

                {/* BM25 Keyword Relevance Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-white/70 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                      BM25 Relevance (Sparse)
                    </span>
                    <span className="font-mono text-purple-300 font-semibold">{typeof bm25Score === 'number' ? bm25Score.toFixed(2) : bm25Score}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                      style={{ width: `${bm25Pct}%` }}
                    />
                  </div>
                </div>

                {/* Formula note */}
                <div className="text-[9.5px] text-white/40 font-mono pt-0.5">
                  Formula: RRF = Σ 1 / (60 + rank_i)
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
