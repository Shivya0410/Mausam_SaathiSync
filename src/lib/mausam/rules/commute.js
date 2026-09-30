// Commuter persona rules (PRD section 6.7, commute.*). Pure.
//
// settings.commute: { times: ['08:30', '18:30'], mode: 'two_wheeler'|'car'|
//   'public'|'walk'|'cycle', travelMin?: 45, home?: {lat,lon,name},
//   work?: {lat,lon,name} }

import { T } from '../thresholds.js';
import { nextClockTime, isoAt } from '../time.js';
import { rainSpans, leaveVerdict } from '../commute.js';
import { haversineKm, pointToSegmentKm } from '../geo.js';
import { isTrusted } from '../reports.js';


/** The next departure among the configured times (a departure up to 30 minutes ago still counts). */
export function nextDeparture(ctx) {
  const times = ctx.settings.commute?.times || [];
  const next = times
    .map((c) => nextClockTime(c, ctx.nowMs, ctx.offsetMin, 30))
    .filter((t) => t != null)
    .sort((a, b) => a - b)[0];
  return next ?? null;
}

/**
 * Verified waterlogging reports within 500 m of a saved place or of the
 * straight home-work corridor, in the last 3 hours. Nearest first.
 */
export function waterloggingNear(ctx) {
  const c = ctx.settings.commute || {};
  const maxAge = T.reports.maxAgeHours * 3600 * 1000;
  const out = [];
  for (const r of ctx.reports) {
    if (r.type !== 'waterlogging' || !isTrusted(r)) continue;
    const age = ctx.nowMs - Date.parse(r.observedAt);
    if (!(age >= 0 && age <= maxAge)) continue;
    let best = null;
    for (const p of ctx.savedPlaces) {
      const d = haversineKm(r, p);
      if (d <= T.reports.radiusKm && (!best || d < best.d)) best = { d, place: p.name };
    }
    if (c.home && c.work) {
      const d = pointToSegmentKm(r, c.home, c.work);
      if (d <= T.reports.radiusKm && (!best || d < best.d)) best = { d, place: r.areaName };
    }
    if (best) out.push({ report: r, distanceKm: best.d, place: r.areaName || best.place, minutes: Math.round(age / 60000) });
  }
  return out.sort((a, b) => a.distanceKm - b.distanceKm);
}

export const commuteRules = [
  {
    id: 'commute.leave',
    personas: ['commute'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const dep = nextDeparture(ctx);
      if (dep == null || dep - ctx.nowMs > 18 * 3600 * 1000) return null;
      const c = ctx.settings.commute || {};
      const v = leaveVerdict({
        now: ctx.nowMs,
        departure: dep,
        travelMin: c.travelMin || 45,
        spans: rainSpans(ctx.window(ctx.nowMs - 3600e3, 24)),
      });
      const at = ctx.hourAt(dep);
      return {
        departure: isoAt(dep, ctx.offsetMin),
        startsAt: isoAt(dep, ctx.offsetMin),
        verdict: v.verdict,
        time: v.at != null ? isoAt(v.at, ctx.offsetMin) : null,
        rainStart: v.rainStart != null ? isoAt(v.rainStart, ctx.offsetMin) : null,
        fog: at?.visibilityM != null && at.visibilityM < T.fog.tipVisibilityM,
        heat: c.mode === 'two_wheeler' && at?.feelsC >= T.heat.tipHi,
        waterlogging: waterloggingNear(ctx).length > 0,
      };
    },
    severity: (m) => (m.verdict === 'no_rain' || m.verdict === 'leave_on_time' ? 1 : 2),
    chips: (m) => (m.verdict === 'carry_gear' || m.verdict === 'wait_until' ? ['raincoat'] : []),
    source: ['forecast', 'reports'],
  },
  {
    id: 'commute.waterlogging',
    personas: ['commute', 'family', 'work'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const hits = waterloggingNear(ctx);
      if (!hits.length) return null;
      const first = hits[0];
      return { place: first.place, minutes: first.minutes, count: hits.length, reportId: first.report.id };
    },
    severity: () => 2,
    chips: [],
    source: ['reports'],
  },
  {
    id: 'commute.twoWheelerHeat',
    personas: ['commute'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const c = ctx.settings.commute || {};
      if (c.mode !== 'two_wheeler') return null;
      for (const clock of c.times || []) {
        const at = nextClockTime(clock, ctx.nowMs, ctx.offsetMin, 30);
        if (at == null || at - ctx.nowMs > 18 * 3600 * 1000) continue;
        const h = ctx.hourAt(at);
        if (h?.feelsC >= T.heat.tipHi) return { time: isoAt(at, ctx.offsetMin), startsAt: isoAt(at, ctx.offsetMin), hi: Math.round(h.feelsC) };
      }
      return null;
    },
    severity: () => 1,
    chips: ['water', 'cap'],
    source: ['forecast'],
  },
];
