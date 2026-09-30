// Beach (coast.*) and fisher (fisher.*) rules (PRD section 6.7). Pure.

import { T } from '../thresholds.js';
import { seaVerdict, fisherVerdict, tideExtrema } from '../indices/seaSafety.js';
import { thunderProb } from './general.js';
import { sliceHours, addDays, hourOfIso, HOUR_MS } from '../time.js';
import { endOfHour } from '../indices/windows.js';

const MARINE_HAZARDS = ['high_waves', 'cyclone'];

function marineWarnings(ctx) {
  return ctx.officialWarnings.filter(
    (w) => w.level >= 2 && (w.source === 'imd_marine' || MARINE_HAZARDS.includes(w.hazard)),
  );
}

/** Sea verdict for the next 3 hours at the current place. */
export function seaNow(ctx) {
  const sea = sliceHours(ctx.marine?.hourly, ctx.nowMs, 3);
  const land = ctx.window(ctx.nowMs, 3);
  if (!sea.length && !marineWarnings(ctx).length) return null;
  const max = (arr, k) => (arr.length ? Math.max(...arr.map((x) => x[k] ?? 0)) : undefined);
  const tides = tideExtrema(ctx.marine?.hourly || []);
  const nearLowTide = tides.some(
    (t) => t.type === 'low' && Math.abs(Date.parse(t.time) - ctx.nowMs) <= HOUR_MS,
  );
  const official = marineWarnings(ctx);
  return seaVerdict({
    waveM: max(sea, 'waveM'),
    swellM: max(sea, 'swellM'),
    swellPeriodS: max(sea, 'swellPeriodS'),
    windKmh: max(land, 'windKmh'),
    gustKmh: max(land, 'gustKmh'),
    officialWarning: official.some((w) => w.hazard !== 'cyclone'),
    cycloneWarning: official.some((w) => w.hazard === 'cyclone'),
    thunderNext3h: land.some((h) => thunderProb(h) >= T.thunder.probNext3h),
    nearLowTide,
    ripProne: Boolean(ctx.settings.coast?.ripProne),
  });
}

export const coastRules = [
  {
    id: 'coast.stayOut',
    personas: ['coast'],
    kind: 'tip',
    hazard: 'sea',
    when(ctx) {
      const v = seaNow(ctx);
      return v?.verdict === 'stay_out' ? { reason: v.reasons[0], reasons: v.reasons } : null;
    },
    severity: () => 3,
    chips: [],
    source: ['marine', 'warnings'],
  },
  {
    id: 'coast.caution',
    personas: ['coast'],
    kind: 'tip',
    hazard: 'sea',
    when(ctx) {
      const v = seaNow(ctx);
      return v?.verdict === 'caution' ? { reason: v.reasons[0], reasons: v.reasons } : null;
    },
    severity: () => 2,
    chips: [],
    source: ['marine'],
  },
  {
    id: 'coast.goodDay',
    personas: ['coast'],
    kind: 'good',
    hazard: null,
    when(ctx) {
      const v = seaNow(ctx);
      if (v?.verdict !== 'safe') return null;
      const rainy = ctx.window(ctx.nowMs, 12).some((h) => (h.precipProb ?? 0) >= 30);
      if (rainy) return null;
      const high = tideExtrema(ctx.marine?.hourly || []).find(
        (t) => t.type === 'high' && Date.parse(t.time) >= ctx.nowMs,
      );
      const today = ctx.day(0);
      return { time: high?.time ?? null, sunset: today?.sunset ?? null, uv: today?.uvMax ?? null };
    },
    severity: () => 0,
    chips: ['sunscreen'],
    source: ['marine', 'forecast'],
  },
  {
    id: 'fisher.noGo',
    personas: ['fisher'],
    kind: 'tip',
    // Deliberately its own group: this is the go/no-go decision fishers act
    // on, shown alongside (not folded into) the verbatim official card.
    hazard: 'sea_fisher',
    when(ctx) {
      const official = marineWarnings(ctx)[0];
      const sea = sliceHours(ctx.marine?.hourly, ctx.nowMs, 24);
      const land = ctx.window(ctx.nowMs, 24);
      const v = fisherVerdict({
        officialWarning: Boolean(official),
        maxWindKmh: land.length ? Math.max(...land.map((h) => h.windKmh ?? 0)) : undefined,
        maxWaveM: sea.length ? Math.max(...sea.map((h) => h.waveM ?? 0)) : undefined,
      });
      if (v.verdict !== 'no_go') return null;
      return {
        reason: v.reason,
        text: official?.text ?? null,
        issuer: official?.issuer ?? null,
        validTo: official?.validTo ?? null,
      };
    },
    severity: () => 3,
    chips: [],
    source: ['warnings', 'marine'],
  },
  {
    id: 'fisher.window',
    personas: ['fisher'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const tomorrow = addDays(ctx.dateKey, 1);
      const early = (arr) => (arr || []).filter((h) => h.time.startsWith(tomorrow) && hourOfIso(h.time) >= 4 && hourOfIso(h.time) < 8);
      const land = early(ctx.hourly);
      const sea = early(ctx.marine?.hourly);
      if (!land.length || !sea.length) return null;
      const wind = Math.max(...land.map((h) => h.windKmh ?? 0));
      const wave = Math.max(...sea.map((h) => h.waveM ?? 0));
      if (wind >= T.sea.fisherCalmWind || wave >= T.sea.fisherCalmWave) return null;
      return {
        start: land[0].time,
        end: endOfHour(land[land.length - 1].time),
        wind: Math.round(wind),
        wave: Math.round(wave * 10) / 10,
      };
    },
    severity: () => 1,
    chips: [],
    source: ['marine', 'forecast'],
  },
];
