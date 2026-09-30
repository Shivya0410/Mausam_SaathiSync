/**
 * Small in-process LRU cache with per-entry TTL (PRD section 12.4).
 *
 * Holds computed snapshots and the last good upstream result for fallback.
 * It is per server instance: on serverless platforms each cold start begins
 * empty. When REDIS_URL is added (optional), a shared cache sits in front.
 */
export class LruCache {
  constructor(max = 500) {
    this.max = max;
    this.map = new Map();
  }

  /** Value if present and younger than maxAgeMs (default: its own TTL). */
  get(key, { maxAgeMs, now = Date.now() } = {}) {
    const hit = this.map.get(key);
    if (!hit) return undefined;
    const limit = maxAgeMs ?? hit.ttlMs;
    if (now - hit.at > limit) {
      if (maxAgeMs === undefined) this.map.delete(key);
      return undefined;
    }
    this.map.delete(key);
    this.map.set(key, hit);
    return hit.value;
  }

  /** Stored time of an entry (ms), or undefined. */
  ageOf(key, now = Date.now()) {
    const hit = this.map.get(key);
    return hit ? now - hit.at : undefined;
  }

  set(key, value, ttlMs, now = Date.now()) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, at: now, ttlMs });
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value);
  }

  get size() {
    return this.map.size;
  }

  clear() {
    this.map.clear();
  }
}

/** One cache per process, shared by all routes (survives dev hot reloads). */
export function sharedCache(name, max = 500) {
  const key = `__mausamCache_${name}`;
  if (!globalThis[key]) globalThis[key] = new LruCache(max);
  return globalThis[key];
}
