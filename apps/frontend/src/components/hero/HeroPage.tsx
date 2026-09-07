import { Shield, Database, Layers, Terminal } from 'lucide-react';
import Hero1 from '../ui/hero-1';

interface HeroPageProps {
  onEnter: () => void;
}

export function HeroPage({ onEnter }: HeroPageProps) {
  const socialLinks = [
    { label: "Problem SIH26117", href: "https://github.com/rav-builds/DEMO-SIH26117" },
    { label: "Architecture Spec", href: "#capabilities" },
    { label: "Zero-Trust Audit", href: "#capabilities" },
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-[#06060c] text-white">
      {/* ── Watermelon Hero 1 Component ── */}
      <Hero1
        brand={
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-[var(--accent)] text-black">
              <Shield size={16} />
            </div>
            <span className="font-semibold text-lg text-white tracking-tight">Sovereign AI</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">
              SIH-26117
            </span>
          </div>
        }
        headline={
          <>
            Sovereign intelligence for
            <br />
            high-stakes environments.
          </>
        }
        ctaLabel="Enter Workbench"
        onCtaClick={onEnter}
        signInLabel="0 Outbound Leaks"
        onSignInClick={onEnter}
        description={`Local reasoning, hybrid document retrieval, and sandboxed code execution\nrunning strictly inside your perimeter with 0 outbound requests, always.`}
        socialLinks={socialLinks}
      />

      {/* ── Below the Fold: 4 Capabilities List ── */}
      <section id="capabilities" className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-20 py-24 border-t border-white/5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 text-left">
          <div className="flex flex-col">
            <div className="text-[var(--accent)] mb-3.5">
              <Database size={22} strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1.5">
              Hybrid Document RAG
            </h2>
            <p className="text-xs text-white/60 leading-relaxed font-normal">
              Combines Qdrant dense vector embeddings and BM25Okapi keyword search over local classified documents.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="text-[var(--accent)] mb-3.5">
              <Layers size={22} strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1.5">
              Autonomous State Graph
            </h2>
            <p className="text-xs text-white/60 leading-relaxed font-normal">
              Stateful multi-step reasoning cycles with deterministic local tool execution and zero telemetry.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="text-[var(--accent)] mb-3.5">
              <Terminal size={22} strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1.5">
              Docker Sandbox Jail
            </h2>
            <p className="text-xs text-white/60 leading-relaxed font-normal">
              Executes untrusted code in hardware-constrained containers with strict --network=none enforcement.
            </p>
          </div>

          <div className="flex flex-col">
            <div className="text-[var(--accent)] mb-3.5">
              <Shield size={22} strokeWidth={1.5} />
            </div>
            <h2 className="text-sm font-semibold text-white mb-1.5">
              Cryptographic Audit
            </h2>
            <p className="text-xs text-white/60 leading-relaxed font-normal">
              Immutable SHA-256 JSONL audit logger maintaining an unalterable chain of custody for every action.
            </p>
          </div>
        </div>
      </section>

      {/* ── Bottom Baseline Footer ── */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-20 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
        <div className="flex items-center gap-2">
          <span>Sovereign AI Workbench</span>
          <span>•</span>
          <span className="font-mono">SIH26117</span>
        </div>
        <div>
          Zero-Trust Local Execution & Zero Egress Verification
        </div>
      </footer>
    </div>
  );
}
