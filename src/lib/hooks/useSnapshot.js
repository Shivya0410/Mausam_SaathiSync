"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

// Weather snapshots for a place (PRD sections 13.4 and 27.8).
//
// The last snapshot for each place is kept in localStorage, so a repeat
// visit paints instantly and works offline; then the API refreshes it. The
// cache holds weather only, never personal data, so it is not user-scoped.

const CACHE_PREFIX = 'mausam.cache.snapshot.v1:';
const EVENT = 'mausam:snapshot';
const memo = new Map(); // key -> { raw, value }
const inflight = new Map(); // url -> Promise

export function placeKey(place, demo) {
  if (!place) return null;
  const base = `${Number(place.lat).toFixed(2)},${Number(place.lon).toFixed(2)}`;
  return demo ? `demo:${demo}:${base}` : base;
}

export function snapshotUrl(place, { include = 'air,warnings,sun', lang = 'en', demo } = {}) {
  const p = new URLSearchParams({
    lat: Number(place.lat).toFixed(2),
    lon: Number(place.lon).toFixed(2),
    include,
    lang,
  });
  if (place.name) p.set('name', String(place.name).slice(0, 80));
  if (place.district) p.set('district', String(place.district).slice(0, 80));
  if (place.state) p.set('state', String(place.state).slice(0, 80));
  if (demo) p.set('demo', demo);
  return `/api/mausam/snapshot?${p.toString()}`;
}

function readCache(key) {
  if (!key || typeof window === 'undefined') return null;
  let raw = null;
  try {
    raw = localStorage.getItem(CACHE_PREFIX + key);
  } catch {
    return null;
  }
  if (!raw) return null;
  const hit = memo.get(key);
  if (hit && hit.raw === raw) return hit.value;
  try {
    const value = JSON.parse(raw);
    memo.set(key, { raw, value });
    return value;
  } catch {
    return null;
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full: keep the in-memory copy for this session.
    memo.set(key, { raw: null, value });
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

/** Fetch once per URL at a time, shared by every caller. */
export function fetchSnapshot(url) {
  // Reuse the request the inline <head> script started (one shot).
  const pre = typeof window !== 'undefined' ? window.__msPrefetch : null;
  if (pre && pre.url === url && !inflight.has(url)) {
    window.__msPrefetch = null;
    inflight.set(url, pre.promise.finally(() => inflight.delete(url)));
  }
  if (!inflight.has(url)) {
    inflight.set(
      url,
      fetch(url)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`http_${r.status}`))))
        .finally(() => inflight.delete(url)),
    );
  }
  return inflight.get(url);
}

/**
 * @param {object|null} place { lat, lon, name?, district?, state? }
 * @param {{ include?: string, lang?: string, demo?: string|null }} [opts]
 * @returns {{ snapshot, status: 'loading'|'ready'|'demo'|'stale'|'error'|'offline', refresh }}
 */
export default function useSnapshot(place, { include = 'air,warnings,sun', lang = 'en', demo = null } = {}) {
  const key = placeKey(place, demo);
  const snapshot = useSyncExternalStore(subscribe, () => readCache(key), () => null);
  const [status, setStatus] = useState('loading');
  const lastFetch = useRef(0);
  const placeRef = useRef(place);
  useEffect(() => {
    placeRef.current = place;
  });

  const refresh = useCallback(async () => {
    const p = placeRef.current;
    if (!key || !p) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setStatus(readCache(key) ? 'offline' : 'error');
      return;
    }
    try {
      const fresh = await fetchSnapshot(snapshotUrl(p, { include, lang, demo }));
      writeCache(key, fresh);
      lastFetch.current = Date.now();
      setStatus(fresh.isDemo ? 'demo' : fresh.stale ? 'stale' : 'ready');
    } catch {
      setStatus(readCache(key) ? 'stale' : 'error');
    }
  }, [key, include, lang, demo]);

  useEffect(() => {
    // Fetching is the external system here; status follows the network.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastFetch.current > 10 * 60 * 1000) refresh();
    };
    const onOnline = () => refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 15 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      clearInterval(timer);
    };
  }, [refresh]);

  // A cached snapshot shows at once while the first fetch is in flight.
  const effective = snapshot && status === 'loading' ? 'stale' : status;
  return { snapshot, status: snapshot?.isDemo && effective !== 'error' ? 'demo' : effective, refresh };
}
