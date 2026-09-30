/**
 * Per-user tracker external store for the Profile page.
 *
 * Why this file exists: `useSyncExternalStore` requires both `getSnapshot`
 * and `getServerSnapshot` to return a *cached* (referentially stable) value.
 * Returning a fresh `{}` / `JSON.parse(...)` object on every call makes React
 * re-render in an infinite loop ("The result of getServerSnapshot should be
 * cached" followed by "Maximum update depth exceeded").
 *
 * Contract:
 * - Server snapshot is a single stable empty object (SSR/hydration safe).
 * - Client snapshot is stable while the underlying localStorage raw string
 *   for that key has not changed (per-key cache, so per-user isolation holds
 *   because callers pass an already-namespaced `userKey(...)`).
 * - Only completed qualifying tracker check-ins are read downstream via
 *   `trackerStoreToEvents`; this module never invents or filters events.
 */

export const TRACKER_CHANGE_EVENT = "swasth:storage";

// Single stable server/empty snapshot. Frozen so accidental mutation throws
// loudly instead of silently polluting every empty consumer.
export const EMPTY_TRACKER_STORE = Object.freeze({});

// Per-key cache: key -> { raw: string | null, snapshot: object }
const snapshotCache = new Map();

export function subscribeToTrackerStore(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener(TRACKER_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(TRACKER_CHANGE_EVENT, callback);
  };
}

export function getTrackerServerSnapshot() {
  return EMPTY_TRACKER_STORE;
}

export function getTrackerSnapshot(key) {
  if (typeof window === "undefined") return EMPTY_TRACKER_STORE;
  let raw = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return EMPTY_TRACKER_STORE;
  }
  if (raw == null) return EMPTY_TRACKER_STORE;
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.snapshot;
  let snapshot;
  try {
    const parsed = JSON.parse(raw);
    snapshot = parsed && typeof parsed === "object" ? parsed : EMPTY_TRACKER_STORE;
  } catch {
    snapshot = EMPTY_TRACKER_STORE;
  }
  snapshotCache.set(key, { raw, snapshot });
  return snapshot;
}

/** Test-only: drop the per-key cache between isolated test cases. */
export function __clearTrackerStoreCache() {
  snapshotCache.clear();
}
