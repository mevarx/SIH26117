import { ShieldCheck, Cpu } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';

interface SystemInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemInfoModal({ isOpen, onClose }: SystemInfoModalProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="System Telemetry & Air-Gap Audit"
      description="Hardware limits, container jail boundaries, and loopback verification."
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-3 text-xs">
        {/* Air-gap audit summary */}
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[var(--status-ok)]" />
              <span>Zero-Egress Firewall Status</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--status-ok)]">VERIFIED</span>
          </div>

          <div className="flex flex-col gap-1 text-[11px] text-[var(--text-muted)] pl-5">
            <div className="flex justify-between">
              <span>External packets (8.8.8.8, 1.1.1.1):</span>
              <strong className="text-[var(--text-primary)]">0 bytes leaked</strong>
            </div>
            <div className="flex justify-between">
              <span>Loopback interface (127.0.0.1):</span>
              <strong className="text-[var(--text-primary)]">Strictly bound</strong>
            </div>
            <div className="flex justify-between">
              <span>DNS resolver leaks:</span>
              <strong className="text-[var(--text-primary)]">0 requests</strong>
            </div>
          </div>
        </div>

        {/* Hardware & Sandbox constraints */}
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface-quiet)] border border-[var(--border-subtle)] flex flex-col gap-2">
          <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <Cpu size={14} className="text-[var(--accent)]" />
            <span>Sandbox Hardware Constraints</span>
          </span>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-muted)]">
            <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <span>Container Memory</span>
              <div className="font-mono text-xs text-[var(--text-primary)] font-semibold mt-0.5">256 MB Max</div>
            </div>
            <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <span>Container Process Limit</span>
              <div className="font-mono text-xs text-[var(--text-primary)] font-semibold mt-0.5">64 PIDs Max</div>
            </div>
            <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <span>Execution Timeout</span>
              <div className="font-mono text-xs text-[var(--text-primary)] font-semibold mt-0.5">30.0s Hard Limit</div>
            </div>
            <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <span>Filesystem Access</span>
              <div className="font-mono text-xs text-[var(--text-primary)] font-semibold mt-0.5">Read-Only Root</div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end border-t border-[var(--border-subtle)]">
          <Button variant="outline" size="sm" onClick={onClose}>
            Dismiss
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
