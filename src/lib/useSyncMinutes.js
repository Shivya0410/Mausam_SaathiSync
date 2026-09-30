"use client";

import { useSyncExternalStore } from 'react';

const SYNC_INTERVAL_MINUTES = 15;

function subscribe(callback) {
  const id = setInterval(callback, 30000);
  return () => clearInterval(id);
}

/**
 * Minutes since the last simulated wearable sync, assuming a sync every 15
 * minutes on the clock. Ticks while the page is open. Null on the server, so
 * the prerendered HTML never shows a stale "synced N min ago".
 */
export default function useSyncMinutes() {
  return useSyncExternalStore(
    subscribe,
    () => new Date().getMinutes() % SYNC_INTERVAL_MINUTES,
    () => null
  );
}
