import { Activity } from 'lucide-react';

interface TraceEvent {
  id: string;
  type: string;
  message: string;
}

export function AgentThoughtConsole({ events }: { events: TraceEvent[] }) {
  return (
    <aside className="mx-4 mb-2 rounded-lg border border-[var(--accent-border)] bg-[#090A10] font-mono shadow-lg">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-xs font-semibold text-[var(--accent)]">
        <Activity size={14} /> Agentic Thought Process Console
        <span className="ml-auto text-[10px] text-[var(--text-muted)]">LIVE SSE</span>
      </div>
      <div className="max-h-28 overflow-y-auto px-3 py-2 text-[11px] leading-5 text-[var(--text-muted)]">
        {events.length ? events.slice(-12).map((event) => (
          <div key={event.id}><span className="text-[var(--accent)]">[{event.type}]</span> {event.message}</div>
        )) : <span>Awaiting an agent task…</span>}
      </div>
    </aside>
  );
}
