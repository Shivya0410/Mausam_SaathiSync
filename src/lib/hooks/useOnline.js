"use client";

import { useSyncExternalStore } from 'react';

function subscribe(cb) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

/** navigator.onLine, true on the server. */
export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}

/**
 * Whether the connection is slow or data saver is on (PRD 13.9 lite mode).
 * Read once; Network Information API is Chrome-only, others report false.
 */
export function connectionIsSlow() {
  if (typeof navigator === 'undefined') return false;
  const c = navigator.connection;
  if (!c) return false;
  return c.saveData === true || c.effectiveType === 'slow-2g' || c.effectiveType === '2g';
}
