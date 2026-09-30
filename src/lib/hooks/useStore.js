"use client";

import { useCallback, useSyncExternalStore } from 'react';
import { useAuth } from '../../store/auth';
import { readKey, subscribe } from '../stores/deviceStore';

/**
 * [value, set] for a device store. The server render (and hydration) sees
 * the store's defaults; the stored value follows right after.
 */
export function useStore(store) {
  const { user } = useAuth();
  const key = store.keyFor(user);
  const value = useSyncExternalStore(
    subscribe,
    () => readKey(key, store.defaults),
    () => store.defaults,
  );
  const set = useCallback((next) => store.write(user, next), [store, user]);
  return [value, set];
}

const noop = () => () => {};

/** False during the server render and hydration, true after. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
