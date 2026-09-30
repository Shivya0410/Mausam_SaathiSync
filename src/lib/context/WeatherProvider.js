"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { stores, resolveCurrentPlace, personaList } from '../stores';
import { useStore, useHydrated } from '../hooks/useStore';
import useSnapshot from '../hooks/useSnapshot';
import { useReports } from '../hooks/useReports';
import { useA11y } from './A11yProvider';
import { isScenario } from '../../data/fixtures/scenarios';
import { pickNotifications } from '../mausam/notify';
import { levelName } from '../mausam/hazards';

const WeatherContext = createContext(null);

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

/**
 * The current place and its weather, shared by every page (PRD 13.4).
 * Also: the ?demo=<scenario> switch (PRD 24.7, demo mode only) and local
 * notifications for new Orange and Red warnings (PRD 7.4, Phase 1).
 */
export function WeatherProvider({ children }) {
  const { i18n, t } = useTranslation();
  const hydrated = useHydrated();
  const { lite } = useA11y();
  const [places, setPlaces] = useStore(stores.places);
  const [current, setCurrent] = useStore(stores.currentPlace);
  const [demoState, setDemoState] = useStore(stores.demo);
  const [notify, setNotify] = useStore(stores.notify);

  const demo = DEMO_MODE && isScenario(demoState.scenario) ? demoState.scenario : null;
  const place = useMemo(() => resolveCurrentPlace(places, current.id), [places, current.id]);
  const [personaState] = useStore(stores.personas);
  const lang = i18n.language === 'hi' ? 'hi' : 'en';
  const wantsSea = personaList(personaState).some((p) => p.id === 'coast' || p.id === 'fisher') || Boolean(demo);
  // Lite mode asks only for warnings (PRD 13.9); air is added on demand.
  const include = lite ? 'warnings,sun' : `air,warnings,sun${wantsSea ? ',marine' : ''}`;
  const { snapshot, status, refresh } = useSnapshot(hydrated ? place : null, { include, lang, demo });
  const reports = useReports(hydrated ? place : null, { scenario: demo });

  // ?demo=<id> or ?demo=off, read once on load.
  useEffect(() => {
    if (!DEMO_MODE) return;
    const q = new URLSearchParams(window.location.search).get('demo');
    if (q === 'off') setDemoState({ scenario: null });
    else if (q && isScenario(q)) setDemoState({ scenario: q });
  }, [setDemoState]);

  // Local notifications for new Orange/Red warnings while the app is open.
  useEffect(() => {
    if (!snapshot || snapshot.isDemo || typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    const offsetMin = (snapshot.utcOffsetSeconds ?? 19800) / 60;
    const { toSend, seen, sentToday } = pickNotifications(snapshot.warnings, notify, Date.now(), offsetMin);
    if (seen.length === (notify.seen || []).length && !toSend.length) return;
    for (const w of toSend) {
      try {
        new Notification(`${t(`levels.${levelName(w.level)}`)} · ${t(`hazards.${w.hazard}`, { defaultValue: w.title })}`, {
          body: w.text || w.area,
          tag: w.id,
        });
      } catch {
        // Some browsers only allow notifications from a service worker.
      }
    }
    setNotify((prev) => ({ ...prev, seen, sentToday }));
  }, [snapshot, notify, setNotify, t]);

  const setCurrentPlace = useCallback((id) => setCurrent({ id }), [setCurrent]);
  const setDemo = useCallback((scenario) => setDemoState({ scenario }), [setDemoState]);

  const value = useMemo(
    () => ({ place, places, setPlaces, setCurrentPlace, snapshot, status, refresh, demo, setDemo, hydrated, reports }),
    [place, places, setPlaces, setCurrentPlace, snapshot, status, refresh, demo, setDemo, hydrated, reports],
  );
  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather used outside WeatherProvider');
  return ctx;
}

/** The phone owner's personas as [{ id, role }]. */
export function usePersonas() {
  const [state, set] = useStore(stores.personas);
  const list = useMemo(() => personaList(state), [state]);
  return { state, list, ids: list.map((p) => p.id), set };
}
