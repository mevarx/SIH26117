import { ChevronDown, RefreshCw, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Popover } from '../ui/Popover';
import { useEndpointHealth } from '../../hooks/useEndpointHealth';

export function EndpointStatus() {
  const { health, refetch } = useEndpointHealth();

  const dotColors = {
    ok: 'bg-[var(--status-ok)]',
    warn: 'bg-[var(--status-warn)]',
    error: 'bg-[var(--status-error)]',
  };

  const labelTexts = {
    ok: 'All systems nominal',
    warn: 'Service degraded',
    error: 'System alerts flagged',
  };

  return (
    <Popover
      align="start"
      className="w-80 p-4"
      trigger={
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer select-none">
          <span className={`inline-block h-2 w-2 rounded-full ${dotColors[health.aggregateStatus]}`} />
          <span className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            {labelTexts[health.aggregateStatus]}
          </span>
          <ChevronDown size={12} className="text-[var(--text-muted)]" />
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {/* Popover Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <span className="text-xs font-semibold text-[var(--text-primary)]">Monitored Endpoints</span>
          <button
            onClick={() => refetch()}
            className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
            title="Refresh Status"
          >
            <RefreshCw size={12} />
          </button>
        </div>

        {/* List of endpoints with actual error messages on failure */}
        <div className="flex flex-col gap-2.5">
          {health.services.map((service, idx) => {
            const isOk = service.status === 'ok';
            const isWarn = service.status === 'warn';
            const isError = service.status === 'error';

            return (
              <div key={idx} className="flex flex-col text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isOk && <CheckCircle2 size={12} className="text-[var(--status-ok)] shrink-0" />}
                    {isWarn && <AlertTriangle size={12} className="text-[var(--status-warn)] shrink-0" />}
                    {isError && <AlertCircle size={12} className="text-[var(--status-error)] shrink-0" />}
                    <span className="font-medium text-[var(--text-primary)]">{service.name}</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    {service.latencyMs ? `${service.latencyMs}ms` : service.endpoint}
                  </span>
                </div>

                {service.detail && (
                  <span className="text-[11px] text-[var(--text-muted)] pl-4.5 mt-0.5">
                    {service.detail}
                  </span>
                )}

                {service.errorMessage && (
                  <span className="text-[11px] text-[var(--status-error)] pl-4.5 mt-0.5 font-mono">
                    {service.errorMessage}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] flex justify-between">
          <span>Loopback Isolation: Active</span>
          <span>Checked: {health.checkedAt}</span>
        </div>
      </div>
    </Popover>
  );
}
