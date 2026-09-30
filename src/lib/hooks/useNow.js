"use client";

import { useSyncExternalStore } from 'react';

// One shared minute ticker for the whole app, so every component agrees on
// "now" and rules re-run as time passes (PRD edge case E5: midnight).
let current = null;
const listeners = new Set();
let timer = null;

function tick() {
  current = Math.floor(Date.now() / 60000) * 60000;
  for (const l of listeners) l();
}

function subscribe(cb) {
  listeners.add(cb);
  if (!timer) {
    tick();
    timer = setInterval(tick, 30000);
  }
  return () => {
    listeners.delete(cb);
    if (!listeners.size) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** Current time in ms, rounded to the minute. Null during the server render. */
export function useNow() {
  return useSyncExternalStore(
    subscribe,
    () => current ?? Math.floor(Date.now() / 60000) * 60000,
    () => null,
  );
}
