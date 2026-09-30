/**
 * Per-user profile-preferences external store for the Profile page.
 *
 * Why this file exists: `useSyncExternalStore` requires both `getSnapshot`
 * and `getServerSnapshot` to return a *cached* (referentially stable) value.
 * Calling `readPrefs(storageKey)` inline (which spreads into a fresh object)
 * or `() => ({ ...DEFAULTS })` for the server snapshot allocates a new
 * object on every read, so React detects a changed snapshot on every render
 * and loops with "The result of getSnapshot should be cached to avoid an
 * infinite loop".
 *
 * Contract (mirrors src/lib/trackerStore.js):
 * - Server snapshot is a single stable frozen defaults object (SSR/hydration safe).
 * - Client snapshot is stable while the underlying localStorage raw string
 *   for that key has not changed (per-key cache, so per-user isolation holds
 *   because callers pass an already-namespaced `userKey(...)`).
 * - Missing / corrupt payloads share the stable defaults snapshot.
 */

export const PROFILE_PREFS_CHANGE_EVENT = 'swasth:storage';

export const PROFILE_PREFS_DEFAULTS = Object.freeze({
  goal: '',
  experience: '',
  sessionLength: '',
  language: '',
  city: '',
  state: '',
});

// Per-key cache: key -> { raw: string, snapshot: object }
const snapshotCache = new Map();

export function subscribeToProfilePrefsStore(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener(PROFILE_PREFS_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(PROFILE_PREFS_CHANGE_EVENT, callback);
  };
}

export function getProfilePrefsServerSnapshot() {
  return PROFILE_PREFS_DEFAULTS;
}

export function getProfilePrefsSnapshot(key) {
  if (typeof window === 'undefined') return PROFILE_PREFS_DEFAULTS;
  let raw = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return PROFILE_PREFS_DEFAULTS;
  }
  if (raw == null || raw === '') return PROFILE_PREFS_DEFAULTS;
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.snapshot;
  let snapshot;
  try {
    const parsed = JSON.parse(raw);
    snapshot = {
      ...PROFILE_PREFS_DEFAULTS,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
    };
  } catch {
    return PROFILE_PREFS_DEFAULTS;
  }
  snapshotCache.set(key, { raw, snapshot });
  return snapshot;
}

export function notifyProfilePrefsChanged() {
  try {
    window.dispatchEvent(new Event(PROFILE_PREFS_CHANGE_EVENT));
  } catch {
    /* ignore */
  }
}

/** Test-only: drop the per-key cache between isolated test cases. */
export function __clearProfilePrefsStoreCache() {
  snapshotCache.clear();
}
