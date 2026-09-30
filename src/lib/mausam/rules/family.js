// Parents and family persona rules (PRD section 6.7, family.*). Pure.
//
// settings.family: { schoolTimes: { morning: '07:15', afternoon: '14:00' } }
// No child names, ages or photos are ever stored (PRD section 15.5).

import { T } from '../thresholds.js';
import { nextClockTime, isoAt, hourOfIso } from '../time.js';
import { waterloggingNear } from './commute.js';

/**
 * Conditions at a school run time. Returns the worst condition and the item
 * to send with the child, or null when nothing is notable.
 */
export function schoolRunCheck(ctx, clock) {
  const at = nextClockTime(clock, ctx.nowMs, ctx.offsetMin, 30);
  if (at == null) return null;
  const h = ctx.hourAt(at);
  if (!h) return null;
  const aqi = ctx.aqiOf(h);
  const found = [];
  if (h.precipProb >= T.rain.schoolProb) found.push({ condition: 'rain', chip: 'umbrella', sev: h.precipProb >= 70 ? 2 : 1 });
  if (h.feelsC >= T.heat.schoolHi) found.push({ condition: 'heat', chip: 'water', sev: h.feelsC >= T.heat.tipHi ? 2 : 1 });
  if (aqi >= T.aqi.poor) found.push({ condition: 'air', chip: 'mask', sev: aqi >= T.aqi.veryPoor ? 2 : 1 });
  if (h.visibilityM != null && h.visibilityM < T.fog.tipVisibilityM) {
    found.push({ condition: 'fog', chip: 'torch', sev: h.visibilityM < T.fog.dense ? 2 : 1 });
  }
  // Trusted crowd reports of waterlogging near a saved place (PRD 11.2).
  const water = waterloggingNear(ctx);
  if (water.length) {
    const deep = Math.max(...water.map((w) => w.report.severity || 1));
    found.push({ condition: 'waterlogging', chip: 'raincoat', sev: deep >= 2 ? 2 : 1 });
  }
  if (!found.length) return null;
  const worst = found.reduce((a, b) => (b.sev > a.sev ? b : a));
  return {
    time: isoAt(at, ctx.offsetMin),
    startsAt: isoAt(at, ctx.offsetMin),
    condition: worst.condition,
    conditions: found.map((f) => f.condition),
    chips: [...new Set(found.map((f) => f.chip))],
    prob: h.precipProb,
    hi: Math.round(h.feelsC),
    aqi,
    visibilityM: h.visibilityM,
    sev: Math.max(...found.map((f) => f.sev)),
  };
}

function schoolRule(id, slot) {
  return {
    id,
    personas: ['family'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const clock = ctx.settings.family?.schoolTimes?.[slot];
      return clock ? schoolRunCheck(ctx, clock) : null;
    },
    severity: (m) => m.sev,
    chips: (m) => m.chips,
    source: ['forecast', 'air', 'reports'],
  };
}

export const familyRules = [
  schoolRule('family.schoolMorning', 'morning'),
  schoolRule('family.schoolAfternoon', 'afternoon'),
  {
    id: 'family.outdoorPlay',
    personas: ['family'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      if (ctx.local.hour >= 19) return null;
      const play = ctx.hoursOn(ctx.dateKey).filter((h) => {
        const hr = hourOfIso(h.time);
        return hr >= 16 && hr < 19;
      });
      const bad = play.find((h) => ctx.aqiOf(h) >= T.aqi.poor || h.feelsC >= T.heat.tipHi);
      if (!bad) return null;
      return { startsAt: bad.time, aqi: ctx.aqiOf(bad), hi: Math.round(bad.feelsC) };
    },
    severity: () => 1,
    chips: ['water'],
    source: ['forecast', 'air'],
  },
];
