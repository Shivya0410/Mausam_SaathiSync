// Farmer and gardener persona rules (PRD section 6.7, farm.*). Pure.

import { T } from '../thresholds.js';
import { sprayWindow, frostRisk } from '../indices/farm.js';
import { isHailCode } from '../wmo.js';
import { thunderProb } from './general.js';
import { hourOfIso, addDays } from '../time.js';

/** Tonight's minimum temperature, mean cloud and wind (20:00 to 08:00). */
export function tonight(ctx) {
  const today = ctx.dateKey;
  const tomorrow = addDays(today, 1);
  const night = ctx.hourly.filter((h) => {
    const d = h.time.slice(0, 10);
    const hr = hourOfIso(h.time);
    return (d === today && hr >= 20) || (d === tomorrow && hr < 8);
  });
  const dayMin = (ctx.local.hour >= 12 ? ctx.day(1) : ctx.day(0))?.minC;
  if (!night.length) return { tminC: dayMin ?? null, cloudPct: undefined, windKmh: undefined };
  const mean = (k) => night.reduce((s, h) => s + (h[k] ?? 0), 0) / night.length;
  const hourlyMin = Math.min(...night.map((h) => h.tempC));
  return {
    tminC: Number.isFinite(dayMin) ? Math.min(dayMin, hourlyMin) : hourlyMin,
    cloudPct: mean('cloudPct'),
    windKmh: mean('windKmh'),
  };
}

export const farmRules = [
  {
    id: 'farm.spray',
    personas: ['farm'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const w = sprayWindow(ctx.hourly, ctx.dateKey);
      if (!w || Date.parse(w.end) <= ctx.nowMs) return null;
      return { startsAt: w.start, start: w.start, end: w.end };
    },
    severity: () => 1,
    chips: [],
    source: ['forecast'],
  },
  {
    id: 'farm.noSpray',
    personas: ['farm'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const hit = ctx
        .window(ctx.nowMs, T.rain.noSprayHours)
        .find((h) => h.precipProb >= T.rain.noSprayProb);
      return hit ? { startsAt: hit.time, when: hit.time, prob: hit.precipProb } : null;
    },
    severity: () => 2,
    chips: [],
    source: ['forecast'],
  },
  {
    id: 'farm.heavyRainPrep',
    personas: ['farm'],
    kind: 'tip',
    hazard: 'rain_heavy',
    when(ctx) {
      for (let i = 0; i < 5; i++) {
        const d = ctx.day(i);
        if (d && d.precipMm >= T.rain.dayHeavyMm) return { day: d.date, mm: Math.round(d.precipMm) };
      }
      return null;
    },
    severity: () => 2,
    chips: [],
    source: ['forecast'],
  },
  {
    id: 'farm.dryIrrigate',
    personas: ['farm'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const h = ctx.hourAt(ctx.nowMs) || ctx.hourly[0];
      const top = h?.soil?.m0_1;
      if (!(top < T.soil.dryTopsoil)) return null;
      const days = [0, 1, 2].map((i) => ctx.day(i)).filter(Boolean);
      if (!days.length) return null;
      if (days.some((d) => d.precipMm >= T.soil.recentRainMm)) return null;
      return { moisture: Math.round(top * 100) / 100 };
    },
    severity: () => 1,
    chips: [],
    source: ['forecast'],
  },
  {
    id: 'farm.frost',
    personas: ['farm'],
    kind: 'tip',
    hazard: 'frost',
    when(ctx) {
      const n = tonight(ctx);
      const risk = frostRisk(n);
      return risk === 'high' || risk === 'moderate' ? { risk, tmin: Math.round(n.tminC * 10) / 10 } : null;
    },
    severity: (m) => (m.risk === 'high' ? 3 : 2),
    chips: [],
    source: ['forecast'],
  },
  {
    id: 'farm.hail',
    personas: ['farm'],
    kind: 'tip',
    hazard: 'hail',
    when(ctx) {
      const hit = ctx.window(ctx.nowMs, 48).find((h) => isHailCode(h.wmo));
      if (hit) return { startsAt: hit.time, when: hit.time };
      const day = [0, 1].map((i) => ctx.day(i)).find((d) => d && isHailCode(d.wmo));
      return day ? { when: day.date, day: day.date } : null;
    },
    severity: () => 3,
    chips: [],
    source: ['forecast'],
  },
  {
    id: 'farm.lightningField',
    personas: ['farm'],
    kind: 'tip',
    hazard: 'thunder',
    when(ctx) {
      const hit = ctx
        .window(ctx.nowMs, 6)
        .find((h) => h.isDay !== false && thunderProb(h) >= T.thunder.farmProb);
      return hit ? { startsAt: hit.time, time: hit.time, prob: thunderProb(hit) } : null;
    },
    severity: () => 3,
    chips: [],
    source: ['forecast'],
  },
  {
    id: 'farm.heatLivestock',
    personas: ['farm'],
    kind: 'tip',
    hazard: 'heat',
    when(ctx) {
      const hot = ctx.window(ctx.nowMs, 14).filter((h) => h.feelsC >= T.heat.tipHi);
      if (!hot.length) return null;
      return { startsAt: hot[0].time, hi: Math.round(Math.max(...hot.map((h) => h.feelsC))) };
    },
    severity: () => 2,
    chips: ['water'],
    source: ['forecast'],
  },
];
