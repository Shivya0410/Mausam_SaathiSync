// Run Score (0 to 100) per hour and the best running window
// (PRD section 6.6.3). Also the outdoor comfort score (6.6.5). Pure.

import { T } from '../thresholds.js';
import { aqiPenalty } from './naqi.js';
import { uvPenalty } from './uv.js';
import { isThunderCode } from '../wmo.js';
import { bestBlock, hourIn } from './windows.js';

export function heatPenalty(hi) {
  if (!Number.isFinite(hi) || hi <= 24) return 0;
  if (hi <= 32) return 2 * (hi - 24);
  return 16 + 4 * (hi - 32);
}

export function rainPenalty(prob, mm) {
  if (prob >= 60 && mm >= 0.5) return 40;
  if (prob >= 30) return 15;
  return 0;
}

export function windPenalty(gust, activity) {
  const factor = activity === 'cycle' ? 1.5 : 1;
  if (gust >= 40) return 20 * factor;
  if (gust >= 25) return 8 * factor;
  return 0;
}

/**
 * Score one hour. Returns { score, unsafe, penalties } where penalties is a
 * { factor: points } map used to explain the score ("top 2 reasons").
 *
 * @param {object} hour normalised Hour
 * @param {object} [opts]
 * @param {string} [opts.activity] run | walk | cycle | sports | yoga | trek
 * @param {boolean} [opts.nightOk] user runs at night, no dark penalty
 * @param {boolean} [opts.thunderNowcast] IMD nowcast thunderstorm this hour
 * @param {number} [opts.aqiWeight=1] 1.5 for sensitive health users
 * @param {number} [opts.uvWeight=1] 1.5 for skin sensitivity
 */
export function scoreHour(hour, opts = {}) {
  const { activity, nightOk = false, thunderNowcast = false, aqiWeight = 1, uvWeight = 1 } = opts;
  const hi = hour.feelsC ?? hour.tempC;
  if (isThunderCode(hour.wmo) || thunderNowcast) {
    return { score: 0, unsafe: true, penalties: { lightning: 100 } };
  }
  if (Number.isFinite(hi) && hi >= T.heat.tipHi) {
    return { score: 0, unsafe: true, penalties: { heat: 100 } };
  }
  const penalties = {
    heat: heatPenalty(hi),
    air: aqiPenalty(hour.aqi) * aqiWeight,
    rain: rainPenalty(hour.precipProb ?? 0, hour.precipMm ?? 0),
    wind: windPenalty(hour.gustKmh ?? 0, activity),
    uv: uvPenalty(hour.uv) * uvWeight,
    dark: hour.isDay === false && !nightOk ? 15 : 0,
  };
  const total = Object.values(penalties).reduce((s, v) => s + v, 0);
  return { score: Math.round(Math.max(0, Math.min(100, 100 - total))), unsafe: false, penalties };
}

/** The two biggest penalty factors, for the "why" line. */
export function topFactors(penalties, n = 2) {
  return Object.entries(penalties)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

/** Preferred time bands as [fromHour, toHour) of hour starts (PRD 6.6.3). */
export const TIME_BANDS = Object.freeze({
  early_morning: [4, 8],
  morning: [6, 10],
  evening: [16, 20],
  night: [20, 23],
});

/**
 * Best running window.
 * @param {Array} hours next 36 hours of normalised Hour records
 * @param {object} opts { activity, durationMin, band, thunderHours:Set<string> }
 * @returns {{ start, end, score, outsideBand, hours, scored } | { none: true, scored }}
 */
export function bestRunWindow(hours, { activity = 'run', durationMin = 60, band = null, thunderHours } = {}) {
  const nightOk = band === 'night';
  const scored = hours.map((h) => ({
    ...h,
    ...scoreHour(h, { activity, nightOk, thunderNowcast: thunderHours?.has(h.time) }),
  }));
  const size = Math.max(1, Math.ceil(durationMin / 60));
  const minScore = T.windowMinScore;
  const range = band && TIME_BANDS[band];
  if (range) {
    const inBand = bestBlock(scored, { size, minScore, allowed: (h) => hourIn(h.time, range[0], range[1]) });
    if (inBand) return { ...inBand, outsideBand: false, scored };
  }
  const any = bestBlock(scored, { size, minScore });
  if (any) return { ...any, outsideBand: Boolean(range), scored };
  return { none: true, scored };
}

/**
 * Outdoor comfort (PRD 6.6.5): the Run Score with heavier AQI and UV weights
 * for health users with sensitivities.
 */
export function outdoorComfortOpts(sensitivities = []) {
  const s = new Set(sensitivities);
  return {
    aqiWeight: s.has('asthma') || s.has('elderly') || s.has('heart') ? 1.5 : 1,
    uvWeight: s.has('skin') ? 1.5 : 1,
    activity: 'walk',
  };
}
