"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { haversineKm } from '../mausam/geo';
import { REPORT_RADIUS_KM } from '../mausam/reports';

const EMPTY = Object.freeze([]);

/**
 * Crowd reports near a place (PRD 9.7). In a demo scenario, the scenario's
 * labelled demo reports are used instead of live ones. Refreshes every
 * 5 minutes while the page is visible.
 * @returns {{ reports: Array, status: 'idle'|'loading'|'ready'|'error', durable: boolean|null, refresh }}
 */
export function useReports(place, { scenario = null, enabled = true } = {}) {
  const [state, setState] = useState({ reports: [], status: 'idle', durable: null, key: null });
  const key = place && enabled ? `${place.lat?.toFixed(2)},${place.lon?.toFixed(2)}|${scenario || ''}` : null;

  const refresh = useCallback(async () => {
    if (!key) return;
    if (scenario) {
      const now = Date.now();
      // Fixtures load only in demo mode.
      const { scenarioReports } = await import('../../data/fixtures/scenarios');
      const list = scenarioReports(scenario, now).map((r) => ({ ...r, distanceKm: Math.round(haversineKm(place, r) * 10) / 10 }));
      setState({ reports: list, status: 'ready', durable: null, key });
      return;
    }
    try {
      const p = new URLSearchParams({ lat: place.lat.toFixed(3), lon: place.lon.toFixed(3), radiusKm: String(REPORT_RADIUS_KM) });
      const res = await fetch(`/api/mausam/reports?${p}`);
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
      setState({ reports: json.reports || [], status: 'ready', durable: Boolean(json.durable), key });
    } catch {
      setState((s) => ({ ...s, status: 'error', key }));
    }
    // place is captured by key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!key) return undefined;
    // Fetching is the external system; state follows the network.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [key, refresh]);

  const current = state.key === key;
  const reports = current ? state.reports : EMPTY;
  const status = !key ? 'idle' : current ? state.status : 'loading';
  const durable = current ? state.durable : null;
  return useMemo(() => ({ reports, status, durable, refresh }), [reports, status, durable, refresh]);
}
