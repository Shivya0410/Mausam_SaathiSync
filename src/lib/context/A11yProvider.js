"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { stores } from '../stores';
import { useStore } from '../hooks/useStore';
import { connectionIsSlow } from '../hooks/useOnline';

const A11yContext = createContext(null);

export const TEXT_SCALES = [90, 100, 125, 150, 200];

const noop = () => () => {};

/**
 * Applies the accessibility settings (PRD 5.3, 20.14) as classes on <html>:
 * ms-text-<scale>, ms-hc (high contrast), ms-simple (simple view, which also
 * raises text to 125%), ms-reduce-motion and ms-lite. Lite mode turns itself
 * on for data saver or 2G unless the user chose otherwise (PRD 13.9).
 */
export function A11yProvider({ children }) {
  const [a11y, setA11y] = useStore(stores.a11y);
  const slow = useSyncExternalStore(noop, connectionIsSlow, () => false);
  const lite = a11y.lite ?? slow;
  const scale = a11y.simple && a11y.textScale < 125 ? 125 : a11y.textScale;

  useEffect(() => {
    const html = document.documentElement;
    for (const s of TEXT_SCALES) html.classList.toggle(`ms-text-${s}`, s === scale);
    html.classList.toggle('ms-hc', a11y.contrast);
    html.classList.toggle('ms-simple', a11y.simple);
    html.classList.toggle('ms-reduce-motion', a11y.reduceMotion);
    html.classList.toggle('ms-lite', lite);
  }, [scale, a11y.contrast, a11y.simple, a11y.reduceMotion, lite]);

  const value = useMemo(
    () => ({
      ...a11y,
      lite,
      liteAuto: a11y.lite === null && slow,
      scale,
      set: (patch) => setA11y((prev) => ({ ...prev, ...patch })),
    }),
    [a11y, lite, slow, scale, setA11y],
  );
  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
}

export function useA11y() {
  const ctx = useContext(A11yContext);
  if (!ctx) throw new Error('useA11y used outside A11yProvider');
  return ctx;
}
