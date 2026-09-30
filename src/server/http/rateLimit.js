/**
 * A small in-memory sliding-window limiter for public POST routes (PRD 11.2:
 * "IP-based limit in the route handler"). Per instance only: on serverless
 * hosts it is a speed bump, and the repository-level per-device limit is the
 * real control. The IP is hashed-in-memory only and never stored or logged.
 */

import { ApiError } from './errors.js';

const MAX_KEYS = 10000;

export function createLimiter({ limit, windowMs }) {
  const hits = new Map();
  return function check(key, now = Date.now()) {
    const since = now - windowMs;
    const list = (hits.get(key) || []).filter((t) => t > since);
    if (list.length >= limit) {
      const retryAfterS = Math.ceil((list[0] + windowMs - now) / 1000);
      throw ApiError.rateLimited('Too many requests from this network. Please try again later.', { retryAfterS });
    }
    list.push(now);
    hits.delete(key);
    hits.set(key, list);
    if (hits.size > MAX_KEYS) hits.delete(hits.keys().next().value);
  };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
