import { Activity, Bot, ChevronRight, Radio, Wrench } from 'lucide-react';
import type { ReactNode } from 'react';

interface TraceEvent {
  id: string;
  type: string;
  message: string;
}

const eventStyles: Record<string, { label: string; className: string }> = {
  reasoning: { label: 'REASONING', className: 'border-violet-400/20 bg-violet-400/10 text-violet-200' },
  tool: { label: 'TOOL', className: 'border-amber-400/20 bg-amber-400/10 text-amber-200' },
  error: { label: 'ERROR', className: 'border-red-400/20 bg-red-400/10 text-red-200' },
};

function eventStyle(type: string) {
  return eventStyles[type] ?? { label: type.toUpperCase(), className: 'border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--accent)]' };
}

export function AgentThoughtConsole({ events, isStreaming }: { events: TraceEvent[]; isStreaming: boolean }) {
  const latest = events.slice(-8);
  const toolCount = events.filter((event) => event.type === 'tool').length;
  const reasoningCount = events.filter((event) => event.type === 'reasoning').length;

  return (
    <aside className="mx-4 mb-3 overflow-hidden rounded-xl border border-[var(--accent-border)] bg-[#0B0D14] shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
      <header className="flex items-center justify-between border-b border-white/[0.08] bg-gradient-to-r from-[rgba(var(--accent-rgb),0.11)] to-transparent px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--accent)]">
            <Bot size={16} />
          </div>
          <div>
            <h2 className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wide text-[var(--text-primary)]">
              Agentic Thought Process <span className="text-[var(--accent)]">Console</span>
            </h2>
            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">Structured execution telemetry · no external egress</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-2.5 py-1 font-mono text-[10px] text-[var(--text-muted)]">
          <Radio size={11} className={isStreaming ? 'animate-pulse text-[var(--status-ok)]' : 'text-[var(--text-muted)]'} />
          {isStreaming ? 'STREAMING' : 'SSE READY'}
        </div>
      </header>

      <div className="grid grid-cols-2 divide-x divide-white/[0.06] border-b border-white/[0.07] sm:grid-cols-4">
        <Metric label="EVENTS" value={events.length} icon={<Activity size={13} />} />
        <Metric label="REASONING" value={reasoningCount} icon={<ChevronRight size={13} />} />
        <Metric label="TOOLS" value={toolCount} icon={<Wrench size={13} />} />
        <Metric label="TRANSPORT" value="SSE" icon={<Radio size={13} />} />
      </div>

      <div className="max-h-36 min-h-20 overflow-y-auto p-2 font-mono text-[11px]">
        {latest.length ? latest.map((event) => {
          const style = eventStyle(event.type);
          return (
            <div key={event.id} className="flex gap-2 rounded-md px-2 py-1.5 hover:bg-white/[0.035]">
              <span className={`mt-0.5 h-fit shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold tracking-wider ${style.className}`}>{style.label}</span>
              <p className="min-w-0 break-words leading-5 text-[#BEC3D3]">{event.message}</p>
            </div>
          );
        }) : (
          <div className="flex h-16 items-center gap-3 px-3 text-[var(--text-muted)]">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]"><Activity size={13} /></span>
            <div><p className="text-xs text-[#BEC3D3]">Ready for an agent task</p><p className="mt-0.5 text-[10px]">Events will appear here as the graph executes.</p></div>
          </div>
        )}
      </div>
    </aside>
  );
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return <div className="flex items-center gap-2 px-3 py-2.5 text-[var(--text-muted)]"><span className="text-[var(--accent)]">{icon}</span><div><p className="font-mono text-[9px] tracking-wider">{label}</p><p className="mt-0.5 font-mono text-xs font-semibold text-[var(--text-primary)]">{value}</p></div></div>;
}
