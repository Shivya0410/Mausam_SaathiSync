// Device storage for personal settings (PRD sections 4.1 rule 4, 13.6).
//
// Everything personal lives in this browser's localStorage under mausam.*
// keys, namespaced per signed-in identity by userScopedStorage (guest data
// stays separate from account data). Nothing here is sent to a server.
//
// Stores are read with useSyncExternalStore, which needs referentially
// stable snapshots: each key's parsed value is cached against its raw string
// (the pattern trackerStore.js established). The server snapshot is the
// frozen default, so server and first client render always match.

import { userKey } from '../../utils/userScopedStorage.js';

export const STORE_EVENT = 'mausam:store';

const cache = new Map(); // fullKey -> { raw, value }

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepFreeze(v) {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const x of Object.values(v)) deepFreeze(x);
  }
  return v;
}

function storage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/**
 * Read a key. Missing, corrupt or blocked storage returns `fallback`.
 * Plain-object values are merged over the fallback so fields added in a
 * later version get their defaults.
 */
export function readKey(fullKey, fallback) {
  const ls = storage();
  if (!ls) return fallback;
  let raw;
  try {
    raw = ls.getItem(fullKey);
  } catch {
    return fallback;
  }
  if (raw == null) return fallback;
  const hit = cache.get(fullKey);
  if (hit && hit.raw === raw && hit.fallback === fallback) return hit.value;
  let value;
  try {
    const parsed = JSON.parse(raw);
    value = isPlainObject(fallback) && isPlainObject(parsed) ? { ...fallback, ...parsed } : parsed ?? fallback;
  } catch {
    value = fallback;
  }
  deepFreeze(value);
  cache.set(fullKey, { raw, value, fallback });
  return value;
}

/** Write a key and notify subscribers. Returns false when storage is blocked. */
export function writeKey(fullKey, value) {
  const ls = storage();
  let ok = false;
  if (ls) {
    try {
      if (value === undefined) ls.removeItem(fullKey);
      else ls.setItem(fullKey, JSON.stringify(value));
      ok = true;
    } catch {
      ok = false; // storage full or blocked (edge case E19)
    }
  }
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(STORE_EVENT));
  }
  return ok;
}

export function subscribe(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener(STORE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(STORE_EVENT, callback);
  };
}

/**
 * @param {string} baseKey e.g. 'mausam.places.v1'
 * @param {any} defaults
 * @param {{ scoped?: boolean }} [opts] scoped: per signed-in identity (default true)
 */
export function createStore(baseKey, defaults, { scoped = true } = {}) {
  const frozen = deepFreeze(structuredClone(defaults));
  return {
    baseKey,
    defaults: frozen,
    scoped,
    keyFor(user) {
      return scoped ? userKey(baseKey, user) : baseKey;
    },
    read(user) {
      return readKey(this.keyFor(user), frozen);
    },
    /** `next` is a value or an updater (prev) => value. */
    write(user, next) {
      const prev = this.read(user);
      const value = typeof next === 'function' ? next(prev) : next;
      writeKey(this.keyFor(user), value);
      return value;
    },
    clear(user) {
      writeKey(this.keyFor(user), undefined);
    },
  };
}

/** Every mausam.* key on this device (for Settings > Data). */
export function listMausamKeys() {
  const ls = storage();
  if (!ls) return [];
  const out = [];
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k && k.startsWith('mausam.')) out.push(k);
  }
  return out.sort();
}

/** Remove keys with a prefix (e.g. 'mausam.' or 'swasth.'). Returns the count. */
export function clearKeys(prefix) {
  const ls = storage();
  if (!ls) return 0;
  const keys = [];
  for (let i = 0; i < ls.length; i++) {
    const k = ls.key(i);
    if (k && k.startsWith(prefix)) keys.push(k);
  }
  for (const k of keys) ls.removeItem(k);
  cache.clear();
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(STORE_EVENT));
  return keys.length;
}

/** Test-only. */
export function __clearStoreCache() {
  cache.clear();
}
