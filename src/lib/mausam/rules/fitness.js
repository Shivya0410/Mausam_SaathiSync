// Outdoor fitness persona rules (PRD section 6.7, fitness.*). Pure.

import { T } from '../thresholds.js';
import { bestRunWindow } from '../indices/runScore.js';
import { compass8 } from '../geo.js';

function fitnessSettings(ctx) {
  const s = ctx.settings.fitness || {};
  return { activity: s.activity || 'run', durationMin: s.durationMin || 60, band: s.band || null };
}

/** The run window for the next 36 hours with the user's settings. */
export function runWindow(ctx) {
  const s = fitnessSettings(ctx);
  const hours = ctx.window(ctx.nowMs, 36).map((h) => ({ ...h, aqi: ctx.aqiOf(h) }));
  const thunderHours = ctx.thunderNowcast()
    ? new Set(ctx.window(ctx.nowMs, 3).map((h) => h.time))
    : undefined;
  return { ...bestRunWindow(hours, { ...s, thunderHours }), settings: s };
}

export const fitnessRules = [
  {
    id: 'fitness.bestWindow',
    personas: ['fitness'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const w = runWindow(ctx);
      if (w.none) return null;
      return {
        startsAt: w.start,
        start: w.start,
        end: w.end,
        score: w.score,
        activity: w.settings.activity,
        outsideBand: w.outsideBand,
      };
    },
    severity: () => 1,
    chips: ['water'],
    source: ['forecast', 'air'],
  },
  {
    id: 'fitness.noSafeWindow',
    personas: ['fitness'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const w = runWindow(ctx);
      return w.none && w.scored.length ? { hours: w.scored.length } : null;
    },
    severity: () => 2,
    chips: [],
    source: ['forecast', 'air'],
  },
  {
    id: 'fitness.headwind',
    personas: ['fitness'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      if (fitnessSettings(ctx).activity !== 'cycle') return null;
      const gusty = ctx.window(ctx.nowMs, 12).find((h) => h.gustKmh >= T.wind.cyclingHeadwind);
      return gusty
        ? { startsAt: gusty.time, gust: Math.round(gusty.gustKmh), dir: compass8(gusty.windDirDeg) }
        : null;
    },
    severity: () => 1,
    chips: [],
    source: ['forecast'],
  },
];
