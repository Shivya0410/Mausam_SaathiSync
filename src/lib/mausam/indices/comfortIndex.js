// Comfort Index (0 to 100) for events (PRD section 6.6.4). Pure.

import { aqiPenalty } from './naqi.js';

/** Event time slots as [fromHour, toHour). */
export const SLOTS = Object.freeze({
  morning: [7, 11],
  afternoon: [12, 16],
  evening: [17, 21],
  night: [21, 24],
});

/**
 * @param {object} c { tempC, hi, rh, precipProbMax, gustMax, aqi, outdoor }
 * Values are the slot's worst case (max heat, min temp, max rain chance...).
 */
export function comfortIndex({ tempC, hi, rh = 50, precipProbMax = 0, gustMax = 0, aqi, outdoor = true } = {}) {
  const heat = Number.isFinite(hi) ? hi : tempC;
  let score = 100;
  score -= 3 * Math.max(0, (heat ?? 25) - 30);
  score -= 2 * Math.max(0, 18 - (tempC ?? 25));
  score -= 0.5 * Math.max(0, rh - 70);
  score -= 0.6 * precipProbMax;
  score -= 1.0 * Math.max(0, gustMax - 25);
  if (outdoor) score -= aqiPenalty(aqi) * 0.5;
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function comfortBand(score) {
  if (!Number.isFinite(score)) return null;
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Summarise hourly records inside a slot into comfortIndex input.
 * Falls back to the day record when hourly data does not reach the date.
 */
export function slotConditions({ hours = [], day = null, aqi = null, outdoor = true }) {
  if (hours.length) {
    const max = (k) => Math.max(...hours.map((h) => h[k] ?? -Infinity));
    const min = (k) => Math.min(...hours.map((h) => h[k] ?? Infinity));
    return {
      tempC: min('tempC'),
      hi: max('feelsC'),
      rh: max('rh'),
      precipProbMax: max('precipProb'),
      gustMax: max('gustKmh'),
      aqi,
      outdoor,
    };
  }
  if (day) {
    return {
      tempC: day.minC,
      hi: day.feelsMaxC ?? day.maxC,
      rh: 60,
      precipProbMax: day.precipProbMax ?? 0,
      gustMax: day.gustMaxKmh ?? 0,
      aqi,
      outdoor,
    };
  }
  return null;
}
