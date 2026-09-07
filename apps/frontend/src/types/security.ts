export interface AuditEntry {
  timestamp: string;
  event_type: string;
  actor: string;
  action: string;
  details?: Record<string, any>;
  sha256_hash: string;
  task_id?: string;
}

export interface SecurityStatus {
  airgap_verified: boolean;
  loopback_only: boolean;
  outbound_leaks: number;
  firewall_policy: string;
  last_audit_hash?: string;
  total_audit_events?: number;
}

export interface ServiceHealthItem {
  name: string;
  endpoint: string;
  status: 'ok' | 'warn' | 'error';
  latencyMs?: number;
  errorMessage?: string;
  detail?: string;
}

export interface SystemHealthSummary {
  aggregateStatus: 'ok' | 'warn' | 'error';
  services: ServiceHealthItem[];
  checkedAt: string;
}
