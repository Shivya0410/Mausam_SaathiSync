// Health-conscious persona rules (PRD section 6.7, health.*). Pure.

import { T } from '../thresholds.js';
import { categoryOf } from '../indices/naqi.js';
import { uvCategory } from '../indices/uv.js';
import { allergyEstimate } from '../indices/allergyEstimate.js';
import { scoreHour, outdoorComfortOpts } from '../indices/runScore.js';
import { bestBlock, hourIn, contiguousRuns, endOfHour } from '../indices/windows.js';

/** Best 2-hour block to step out, 06:00 to 20:00, in the next 24 hours. */
export function bestTimeOut(ctx) {
  const opts = outdoorComfortOpts(ctx.sensitivities);
  const hours = ctx.window(ctx.nowMs, 24).map((h) => ({
    ...h,
    ...scoreHour({ ...h, aqi: ctx.aqiOf(h) }, opts),
  }));
  return bestBlock(hours, {
    size: 2,
    minScore: T.windowMinScore,
    tolerance: 0,
    allowed: (h) => hourIn(h.time, 6, 20),
  });
}

export const healthRules = [
  {
    id: 'health.bestTimeOut',
    personas: ['health'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const w = bestTimeOut(ctx);
      return w ? { startsAt: w.start, start: w.start, end: w.end, score: w.score } : null;
    },
    severity: () => 1,
    chips: [],
    source: ['forecast', 'air'],
  },
  {
    id: 'health.uvHigh',
    personas: ['health', 'coast', 'fitness'],
    kind: 'tip',
    hazard: 'uv',
    when(ctx) {
      const high = ctx.window(ctx.nowMs, 14).filter((h) => h.uv >= T.uv.tip);
      if (!high.length) return null;
      const uv = Math.max(...high.map((h) => h.uv));
      return {
        startsAt: high[0].time,
        start: high[0].time,
        end: endOfHour(high[high.length - 1].time),
        uv: Math.round(uv),
        category: uvCategory(uv),
      };
    },
    severity: (m) => (m.uv >= T.uv.severe ? 2 : 1),
    chips: ['cap', 'sunscreen', 'sunglasses'],
    source: ['forecast'],
  },
  {
    id: 'health.humid',
    personas: ['health'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      if (!ctx.hasSensitivity('asthma', 'skin')) return null;
      const runs = contiguousRuns(ctx.window(ctx.nowMs, 24), (h) => h.rh >= T.humidity.sensitive);
      const run = runs.find((r) => r.length >= T.humidity.sensitiveHours);
      return run ? { startsAt: run[0].time, start: run[0].time, end: endOfHour(run[run.length - 1].time) } : null;
    },
    severity: () => 1,
    chips: [],
    source: ['forecast'],
  },
  {
    id: 'health.allergyHigh',
    personas: ['health'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      if (!ctx.hasSensitivity('allergies')) return null;
      const h = ctx.hourAt(ctx.nowMs) || ctx.hourly[0];
      if (!h) return null;
      const est = allergyEstimate({
        month: ctx.local.month,
        pm10: ctx.air?.pm10 ?? 0,
        windKmh: h.windKmh,
        rh: h.rh,
        rainingNow: (h.precipMm ?? 0) >= 0.5,
      });
      return est.level === 'high' ? { level: est.level, points: est.points, estimate: true } : null;
    },
    severity: () => 1,
    chips: ['mask'],
    source: ['air', 'forecast'],
  },
  {
    id: 'health.sensitiveAqi',
    personas: ['health'],
    kind: 'tip',
    hazard: 'air',
    when(ctx) {
      if (!ctx.hasSensitivity('asthma', 'heart', 'elderly', 'pregnant', 'children')) return null;
      const aqi = ctx.air?.aqi;
      return aqi >= T.aqi.sensitive ? { aqi, category: categoryOf(aqi) } : null;
    },
    severity: () => 2,
    chips: ['mask'],
    source: ['air'],
  },
];
