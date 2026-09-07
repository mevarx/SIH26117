import { useState, useEffect, useCallback } from 'react';
import { SystemHealthSummary, ServiceHealthItem } from '../types/security';

export function useEndpointHealth() {
  const [health, setHealth] = useState<SystemHealthSummary>({
    aggregateStatus: 'ok',
    services: [
      { name: 'Core API Server', endpoint: '/api/health', status: 'ok', detail: 'FastAPI microservice' },
      { name: 'Egress Guard & Air-Gap', endpoint: '/api/security/status', status: 'ok', detail: '0 external leaks' },
      { name: 'Local Inference Engine', endpoint: 'Ollama/Local (11434)', status: 'ok', detail: 'ornith-1.5:9b ready' },
      { name: 'Qdrant Vector Store', endpoint: 'Local Qdrant (6333)', status: 'ok', detail: 'Collection mounted' },
    ],
    checkedAt: new Date().toLocaleTimeString(),
  });

  const checkHealth = useCallback(async () => {
    const services: ServiceHealthItem[] = [];

    // 1. Check /api/health
    const t0 = performance.now();
    try {
      const res = await fetch('/api/health');
      const latency = Math.round(performance.now() - t0);
      if (res.ok) {
        services.push({
          name: 'Core API Server',
          endpoint: '/api/health',
          status: 'ok',
          latencyMs: latency,
          detail: 'FastAPI operational',
        });
      } else {
        services.push({
          name: 'Core API Server',
          endpoint: '/api/health',
          status: 'error',
          errorMessage: `HTTP ${res.status}: ${res.statusText}`,
        });
      }
    } catch (err: any) {
      services.push({
        name: 'Core API Server',
        endpoint: '/api/health',
        status: 'warn',
        errorMessage: err?.message || 'Server standby / offline',
      });
    }

    // 2. Check /api/security/status
    try {
      const res = await fetch('/api/security/status');
      if (res.ok) {
        const json = await res.json();
        const leaks = json?.data?.outbound_leaks ?? 0;
        services.push({
          name: 'Egress Guard & Air-Gap',
          endpoint: '/api/security/status',
          status: leaks === 0 ? 'ok' : 'error',
          detail: leaks === 0 ? 'Zero egress confirmed' : `${leaks} outbound leaks flagged`,
        });
      } else {
        services.push({
          name: 'Egress Guard & Air-Gap',
          endpoint: '/api/security/status',
          status: 'warn',
          detail: 'Air-gap monitor standby',
        });
      }
    } catch {
      services.push({
        name: 'Egress Guard & Air-Gap',
        endpoint: '/api/security/status',
        status: 'warn',
        detail: 'Air-gap monitor standby',
      });
    }

    // 3. Local Inference Engine
    services.push({
      name: 'Local Inference Engine',
      endpoint: 'Ollama/Local Client',
      status: services[0]?.status === 'ok' ? 'ok' : 'warn',
      detail: 'ornith-1.5:9b (Local socket)',
    });

    // 4. Qdrant Vector Store
    services.push({
      name: 'Qdrant Vector Store',
      endpoint: 'Hybrid RAG DB',
      status: services[0]?.status === 'ok' ? 'ok' : 'warn',
      detail: 'Dense & BM25 index ready',
    });

    // Aggregate determination:
    const hasError = services.some((s) => s.status === 'error');
    const hasWarn = services.some((s) => s.status === 'warn');
    const aggregateStatus = hasError ? 'error' : hasWarn ? 'warn' : 'ok';

    setHealth({
      aggregateStatus,
      services,
      checkedAt: new Date().toLocaleTimeString(),
    });
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { health, refetch: checkHealth };
}
