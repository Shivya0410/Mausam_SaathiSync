/**
 * Per-user weekly-goals external store for the Profile page.
 *
 * Why this file exists: `useSyncExternalStore` requires both `getSnapshot`
 * and `getServerSnapshot` to return a *cached* (referentially stable) value.
 * Calling `JSON.parse(localStorage.getItem(key))` inline (or `() => []` for
 * the server snapshot) allocates a fresh array on every read, so React
 * detects a changed snapshot on every render and loops with
 * "The result of getSnapshot should be cached to avoid an infinite loop".
 *
 * Contract (mirrors src/lib/trackerStore.js):
 * - Server snapshot is a single stable frozen empty array (SSR/hydration safe).
 * - Client snapshot is stable while the underlying localStorage raw string
 *   for that key has not changed (per-key cache, so per-user isolation holds
 *   because callers pass an already-namespaced `userKey(...)`).
 * - Non-array / corrupt payloads share the stable empty snapshot.
 */

export const WEEKLY_GOALS_CHANGE_EVENT = 'swasth:storage';

// Single stable server/empty snapshot. Frozen so accidental mutation throws
// loudly instead of silently polluting every empty consumer.
export const EMPTY_WEEKLY_GOALS = Object.freeze([]);

// Per-key cache: key -> { raw: string, snapshot: array }
const snapshotCache = new Map();

export function subscribeToWeeklyGoalsStore(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener(WEEKLY_GOALS_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(WEEKLY_GOALS_CHANGE_EVENT, callback);
  };
}

export function getWeeklyGoalsServerSnapshot() {
  return EMPTY_WEEKLY_GOALS;
}

export function getWeeklyGoalsSnapshot(key) {
  if (typeof window === 'undefined') return EMPTY_WEEKLY_GOALS;
  let raw = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return EMPTY_WEEKLY_GOALS;
  }
  if (raw == null || raw === '') return EMPTY_WEEKLY_GOALS;
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.snapshot;
  let snapshot;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY_WEEKLY_GOALS;
    snapshot = parsed;
  } catch {
    return EMPTY_WEEKLY_GOALS;
  }
  snapshotCache.set(key, { raw, snapshot });
  return snapshot;
}

export function notifyWeeklyGoalsChanged() {
  try {
    window.dispatchEvent(new Event(WEEKLY_GOALS_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

/** Test-only: drop the per-key cache between isolated test cases. */
export function __clearWeeklyGoalsStoreCache() {
  snapshotCache.clear();
}
