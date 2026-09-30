// Cross-persona rules (PRD section 6.7, general.*). Pure.

import { T } from '../thresholds.js';
import { isThunderCode } from '../wmo.js';
import { categoryOf } from '../indices/naqi.js';
import { scoreHour, outdoorComfortOpts } from '../indices/runScore.js';
import { hourOfIso } from '../time.js';

/** Thunderstorm probability for an hour: explicit when the provider gives it, else inferred from the WMO code. */
export function thunderProb(h) {
  if (Number.isFinite(h.thunderProb)) return h.thunderProb;
  return isThunderCode(h.wmo) ? Math.max(h.precipProb ?? 0, T.thunder.probNext3h) : 0;
}

/** Tonight's minimum: tomorrow's daily minimum after noon, today's before. */
export function nightMin(ctx) {
  const day = ctx.local.hour >= 12 ? ctx.day(1) : ctx.day(0);
  return day?.minC ?? null;
}

export const generalRules = [
  {
    id: 'general.umbrella',
    personas: ['citizen', 'commute', 'family', 'work', 'fitness', 'travel', 'events'],
    kind: 'tip',
    // Not an IMD hazard group, so a heavy-rain warning never swallows it.
    hazard: 'rain_light',
    when(ctx) {
      const hit = ctx
        .window(ctx.nowMs, 12)
        .find((h) => h.precipProb >= T.rain.umbrellaProb && h.precipMm >= T.rain.umbrellaMm);
      return hit ? { startsAt: hit.time, time: hit.time, prob: hit.precipProb, mm: hit.precipMm } : null;
    },
    severity: (m) => (m.prob >= T.rain.umbrellaSevereProb || m.mm >= T.rain.umbrellaSevereMm ? 2 : 1),
    chips: ['umbrella'],
    source: ['forecast'],
    cooldownHours: 6,
  },
  {
    id: 'general.heavyRainSoon',
    personas: ['all'],
    kind: 'tip',
    hazard: 'rain_heavy',
    when(ctx) {
      const hours = ctx.window(ctx.nowMs, 12);
      for (let i = 0; i + 3 <= hours.length; i++) {
        const mm = hours.slice(i, i + 3).reduce((s, h) => s + (h.precipMm ?? 0), 0);
        if (mm >= T.rain.heavy3hMm) return { startsAt: hours[i].time, mm: Math.round(mm * 10) / 10 };
      }
      return null;
    },
    severity: () => 2,
    chips: ['umbrella', 'torch'],
    source: ['forecast'],
  },
  {
    id: 'general.heat',
    personas: ['all'],
    kind: 'tip',
    hazard: 'heat',
    when(ctx) {
      const hot = ctx.window(ctx.nowMs, 14).filter((h) => h.isDay !== false && h.feelsC >= T.heat.tipHi);
      if (!hot.length) return null;
      const peak = hot.reduce((a, b) => (b.feelsC > a.feelsC ? b : a));
      return { startsAt: hot[0].time, start: hot[0].time, end: hot[hot.length - 1].time, hi: Math.round(peak.feelsC) };
    },
    severity: (m) => (m.hi > T.heat.severeHi ? 3 : 2),
    chips: ['water', 'cap'],
    source: ['forecast'],
  },
  {
    id: 'general.warmNight',
    personas: ['health', 'family', 'work', 'citizen'],
    kind: 'tip',
    hazard: 'warm_night',
    when(ctx) {
      const tmin = nightMin(ctx);
      return tmin != null && tmin >= T.heat.warmNightMin ? { tmin: Math.round(tmin) } : null;
    },
    severity: () => 1,
    chips: ['water'],
    source: ['forecast'],
  },
  {
    id: 'general.cold',
    personas: ['all'],
    kind: 'tip',
    hazard: 'cold',
    when(ctx) {
      const tmin = nightMin(ctx);
      return tmin != null && tmin <= T.cold.plainsMin ? { tmin: Math.round(tmin) } : null;
    },
    severity: (m) => (m.tmin <= T.cold.severeMin ? 2 : 1),
    chips: ['jacket'],
    source: ['forecast'],
  },
  {
    id: 'general.fog',
    personas: ['commute', 'travel', 'family', 'work', 'citizen'],
    kind: 'tip',
    hazard: 'fog',
    when(ctx) {
      const foggy = ctx
        .window(ctx.nowMs, 12)
        .filter((h) => h.visibilityM != null && h.visibilityM < T.fog.tipVisibilityM);
      if (!foggy.length) return null;
      const minVis = Math.min(...foggy.map((h) => h.visibilityM));
      return { startsAt: foggy[0].time, start: foggy[0].time, end: foggy[foggy.length - 1].time, visibilityM: minVis };
    },
    severity: () => 2,
    chips: ['torch'],
    source: ['forecast'],
  },
  {
    id: 'general.lightning',
    personas: ['all'],
    kind: 'tip',
    hazard: 'thunder',
    when(ctx) {
      const hit = ctx.window(ctx.nowMs, 3).find((h) => thunderProb(h) >= T.thunder.probNext3h);
      if (!hit) return null;
      const minutes = Math.max(0, Math.round((Date.parse(hit.time) - ctx.nowMs) / 60000));
      return { startsAt: hit.time, time: hit.time, prob: thunderProb(hit), minutes };
    },
    severity: (m) => (m.minutes <= 60 && m.prob >= 60 ? 3 : 2),
    chips: [],
    source: ['forecast'],
  },
  {
    id: 'general.dust',
    personas: ['health', 'commute', 'work', 'citizen'],
    kind: 'tip',
    hazard: 'dust',
    when(ctx) {
      const pm10 = ctx.air?.pm10;
      if (!(pm10 > T.dust.pm10)) return null;
      const gusty = ctx.window(ctx.nowMs, 12).find((h) => h.gustKmh > T.dust.gust);
      return gusty ? { pm10: Math.round(pm10), gust: Math.round(gusty.gustKmh), startsAt: gusty.time } : null;
    },
    severity: () => 2,
    chips: ['mask'],
    source: ['air', 'forecast'],
  },
  {
    id: 'general.aqiPoor',
    personas: ['health', 'family', 'fitness', 'work', 'citizen', 'events'],
    kind: 'tip',
    hazard: 'air',
    when(ctx) {
      const aqi = ctx.air?.aqi;
      return aqi >= T.aqi.poor ? { aqi, category: categoryOf(aqi) } : null;
    },
    severity: () => 2,
    chips: ['mask'],
    source: ['air'],
  },
  {
    id: 'general.aqiSevere',
    personas: ['all'],
    kind: 'tip',
    hazard: 'air',
    // A stronger air tip replaces weaker ones for the same hazard.
    supersedes: ['general.aqiPoor', 'health.sensitiveAqi'],
    when(ctx) {
      const aqi = ctx.air?.aqi;
      return aqi >= T.aqi.severe ? { aqi, category: categoryOf(aqi) } : null;
    },
    severity: () => 3,
    chips: ['mask'],
    source: ['air'],
  },
  {
    id: 'general.goodEvening',
    personas: ['citizen', 'fitness', 'family'],
    kind: 'good',
    hazard: null,
    when(ctx) {
      if (ctx.local.hour >= 21) return null;
      const evening = ctx.hoursOn(ctx.dateKey).filter((h) => {
        const hr = hourOfIso(h.time);
        return hr >= 17 && hr < 21 && Date.parse(h.time) >= ctx.nowMs - 3600e3;
      });
      if (!evening.length) return null;
      const opts = outdoorComfortOpts(ctx.sensitivities);
      const scored = evening.map((h) => ({ h, s: scoreHour({ ...h, aqi: ctx.aqiOf(h) }, opts).score }));
      const mean = scored.reduce((s, x) => s + x.s, 0) / scored.length;
      if (mean < T.goodEveningComfort) return null;
      const best = scored.reduce((a, b) => (b.s > a.s ? b : a));
      return { time: best.h.time, tempC: Math.round(best.h.tempC), comfort: Math.round(mean) };
    },
    severity: () => 0,
    chips: [],
    source: ['forecast', 'air'],
  },
];
