// In-memory provider health counters for /api/mausam/health (PRD 22.3).
// Per server instance; resets on restart. No personal data is recorded.

const WINDOW_MS = 60 * 60 * 1000;

function store() {
  if (!globalThis.__mausamProviderStatus) globalThis.__mausamProviderStatus = new Map();
  return globalThis.__mausamProviderStatus;
}

export function recordProvider(name, { ok, ms, error }, now = Date.now()) {
  if (!name) return;
  const s = store();
  const entry = s.get(name) || { lastSuccess: null, lastError: null, lastErrorAt: null, samples: [] };
  if (ok) entry.lastSuccess = new Date(now).toISOString();
  else {
    entry.lastError = error || 'error';
    entry.lastErrorAt = new Date(now).toISOString();
  }
  entry.samples.push({ at: now, ms, ok });
  entry.samples = entry.samples.filter((x) => now - x.at <= WINDOW_MS).slice(-500);
  s.set(name, entry);
}

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

export function providerStatus(now = Date.now()) {
  const out = {};
  for (const [name, e] of store()) {
    const recent = e.samples.filter((x) => now - x.at <= WINDOW_MS);
    const ms = recent.map((x) => x.ms);
    out[name] = {
      lastSuccess: e.lastSuccess,
      lastError: e.lastError,
      lastErrorAt: e.lastErrorAt,
      requestsLastHour: recent.length,
      errorsLastHour: recent.filter((x) => !x.ok).length,
      p50Ms: percentile(ms, 50),
      p95Ms: percentile(ms, 95),
    };
  }
  return out;
}

export function resetProviderStatus() {
  store().clear();
}
