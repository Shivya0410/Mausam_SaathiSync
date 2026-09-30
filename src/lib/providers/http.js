// Upstream fetch helper for provider adapters (PRD sections 12.4, 12.5).
//
// Adapters never throw raw fetch errors: they get { ok: false, reason } and
// the orchestrator decides the fallback. Every call has a 4 second timeout.

import { recordProvider } from './status.js';

export const DEFAULT_TIMEOUT_MS = 4000;

/**
 * @param {string} url
 * @param {object} opts
 * @param {string} opts.provider name for health stats
 * @param {number} [opts.revalidate] seconds for the Next.js data cache
 * @param {'json'|'text'} [opts.as]
 * @param {number} [opts.timeoutMs]
 * @param {object} [opts.headers]
 * @returns {Promise<{ ok: true, data: any } | { ok: false, reason: string }>}
 */
export async function fetchUpstream(url, { provider, revalidate, as = 'json', timeoutMs = DEFAULT_TIMEOUT_MS, headers } = {}) {
  const started = Date.now();
  try {
    const init = { signal: AbortSignal.timeout(timeoutMs), headers };
    if (revalidate != null) init.next = { revalidate };
    const res = await fetch(url, init);
    if (!res.ok) {
      recordProvider(provider, { ok: false, ms: Date.now() - started, error: `http_${res.status}` });
      return { ok: false, reason: `http_${res.status}` };
    }
    const data = as === 'text' ? await res.text() : await res.json();
    recordProvider(provider, { ok: true, ms: Date.now() - started });
    return { ok: true, data };
  } catch (error) {
    const reason = error?.name === 'TimeoutError' ? 'timeout' : 'network';
    recordProvider(provider, { ok: false, ms: Date.now() - started, error: reason });
    return { ok: false, reason };
  }
}
