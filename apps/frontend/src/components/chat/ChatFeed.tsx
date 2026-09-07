import { useRef } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Sparkles, Terminal, Database, Shield, Lock, ArrowUpRight } from 'lucide-react';
import { TaskMessage } from '../../types/task';
import { MessageItem } from './MessageItem';

interface ChatFeedProps {
  messages: TaskMessage[];
  onSelectPromptChip: (prompt: string) => void;
  onOpenSandbox?: () => void;
  onRunCode?: (code: string) => void;
}

const CAPABILITY_PROMPTS = [
  {
    title: 'Audit Air-Gap Telemetry',
    subtitle: 'Loopback & Egress Verification',
    icon: Shield,
    prompt: 'Verify loopback network firewall policies and audit for any outbound network leaks across ports.',
  },
  {
    title: 'Query Defense Knowledge Base',
    subtitle: 'Dense Vector & BM25 Hybrid Retrieval',
    icon: Database,
    prompt: 'Query the defense procurement specifications and summarize all mandatory security protocols.',
  },
  {
    title: 'Execute Sandboxed Python',
    subtitle: 'Container Jail (--network=none)',
    icon: Terminal,
    prompt: 'Execute a sandboxed Python script to calculate cryptographic SHA-256 hashes within 256MB RAM limits.',
  },
  {
    title: 'Autonomous Multi-Step Agent',
    subtitle: 'State Graph & Tool Loops',
    icon: Sparkles,
    prompt: 'Investigate system access logs for anomalies and verify cryptographic integrity across local files.',
  },
];

export function ChatFeed({
  messages,
  onSelectPromptChip,
  onOpenSandbox,
  onRunCode,
}: ChatFeedProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  if (messages.length === 0) {
    return (
      <div className="flex-1 w-full overflow-y-auto px-4 sm:px-8 py-6 flex flex-col bg-[#06060C]">
        <div className="mx-auto w-full max-w-3xl flex-1 flex flex-col justify-center items-center text-center py-12">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-white/70 font-mono mb-4">
            <Lock size={11} className="text-[var(--accent)]" />
            <span>AIR-GAP ENVIRONMENT ACTIVE • 0 EGRESS</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight mb-2">
            Sovereign Command Console
          </h2>
          <p className="text-sm text-white/60 max-w-lg mb-10 leading-relaxed font-normal">
            Execute local intelligence, hybrid RAG document search, and sandboxed containers with zero cloud telemetry.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl text-left">
            {CAPABILITY_PROMPTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectPromptChip(item.prompt)}
                  className="p-4 rounded-[var(--radius-lg)] bg-[#0E0F17] hover:bg-[#131520] border border-white/[0.08] hover:border-[var(--accent-border)] text-left transition-all duration-200 cursor-pointer select-none group shadow-sm hover:shadow-[0_4px_20px_rgba(76,201,192,0.1)]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-white font-medium text-xs">
                      <div className="h-6 w-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[var(--accent)] group-hover:bg-[var(--accent-muted)] transition-colors">
                        <Icon size={13} />
                      </div>
                      <span className="font-semibold text-white">{item.title}</span>
                    </div>
                    <ArrowUpRight
                      size={14}
                      className="text-white/40 group-hover:text-[var(--accent)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                  <span className="text-[11px] text-white/50 block leading-relaxed line-clamp-2 pl-8">
                    {item.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col bg-[#06060C] overflow-hidden">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        followOutput="auto"
        className="h-full w-full custom-scrollbar"
        itemContent={(_index, message) => (
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-8">
            <MessageItem
              key={message.id}
              message={message}
              onOpenSandbox={onOpenSandbox}
              onRunCode={onRunCode}
            />
          </div>
        )}
      />
    </div>
  );
}

