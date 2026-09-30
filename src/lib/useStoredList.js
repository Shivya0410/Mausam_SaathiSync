"use client";

import { useCallback, useMemo, useSyncExternalStore } from 'react';

const CHANGE_EVENT = 'swasth:storage';

function read(key) {
  try {
    return localStorage.getItem(key) || '[]';
  } catch {
    return '[]';
  }
}

function subscribe(callback) {
  window.addEventListener('storage', callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

/**
 * A list of ids kept in localStorage (saved venues, bookmarked posts, claps).
 *
 * Device-local conveniences only: nothing sensitive belongs here. Reading goes
 * through useSyncExternalStore so the server render sees an empty list and the
 * browser picks up the stored value without a setState-in-effect, and every
 * component using the same key stays in sync.
 */
export default function useStoredList(key) {
  const raw = useSyncExternalStore(subscribe, () => read(key), () => '[]');

  const list = useMemo(() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [raw]);

  const write = useCallback(
    (next) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage blocked (private mode, quota): the change is not kept.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key]
  );

  const toggle = useCallback(
    (id) => {
      const current = JSON.parse(read(key));
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      write(next);
      return next.includes(id);
    },
    [key, write]
  );

  return { list, has: (id) => list.includes(id), toggle, write };
}
