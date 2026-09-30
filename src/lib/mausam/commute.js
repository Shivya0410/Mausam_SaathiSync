// "Leave now or wait?" (PRD section 6.6.10). Pure.

import { T } from './thresholds.js';
import { HOUR_MS } from './time.js';

const MIN = 60 * 1000;

/**
 * Rainy spans from hourly records: consecutive hours with rain probability
 * and amount at the umbrella thresholds.
 * @returns {Array<{ start: number, end: number }>} ms, end exclusive
 */
export function rainSpans(hours, { prob = T.rain.umbrellaProb, mm = T.rain.umbrellaMm } = {}) {
  const spans = [];
  for (const h of hours) {
    if ((h.precipProb ?? 0) < prob || (h.precipMm ?? 0) < mm) continue;
    const t = Date.parse(h.time);
    const last = spans[spans.length - 1];
    if (last && last.end === t) last.end = t + HOUR_MS;
    else spans.push({ start: t, end: t + HOUR_MS });
  }
  return spans;
}

/**
 * @param {object} c
 * @param {number} c.now ms
 * @param {number} c.departure ms, the next configured departure time
 * @param {number} [c.travelMin=45]
 * @param {Array<{start:number,end:number}>} c.spans rain spans (ms)
 * @returns {{ verdict: 'no_rain'|'leave_on_time'|'wait_until'|'leave_by'|'carry_gear', at?: number, rainStart?: number }}
 */
export function leaveVerdict({ now, departure, travelMin = 45, spans = [] }) {
  const arrive = departure + travelMin * MIN;
  const horizonStart = departure - 60 * MIN;
  const horizonEnd = arrive + 90 * MIN;
  const relevant = spans
    .filter((s) => s.end > Math.min(now, horizonStart) && s.start < horizonEnd)
    .sort((a, b) => a.start - b.start);

  for (const s of relevant) {
    // Rain already falling now.
    if (s.start <= now && s.end > now) {
      if (s.end <= departure) continue; // stops before we leave
      if (s.end - departure <= 60 * MIN) return { verdict: 'wait_until', at: s.end };
      return { verdict: 'carry_gear', rainStart: s.start };
    }
    if (s.end <= now) continue;
    // Rain starts before departure: leave earlier if there is still time.
    if (s.start <= departure) {
      const leaveBy = s.start - 15 * MIN;
      if (leaveBy > now) return { verdict: 'leave_by', at: leaveBy, rainStart: s.start };
      return { verdict: 'carry_gear', rainStart: s.start };
    }
    if (s.start > arrive) return { verdict: 'leave_on_time', rainStart: s.start };
    return { verdict: 'carry_gear', rainStart: s.start };
  }
  return { verdict: 'no_rain' };
}

/** Deep link for live traffic (Google Maps directions). */
export function trafficLink(origin, destination, mode = 'driving') {
  const travelmode = mode === 'public' ? 'transit' : mode === 'two_wheeler' ? 'two-wheeler' : mode === 'walk' ? 'walking' : mode === 'cycle' ? 'bicycling' : 'driving';
  const p = new URLSearchParams({
    api: '1',
    origin: `${origin.lat},${origin.lon}`,
    destination: `${destination.lat},${destination.lon}`,
    travelmode,
  });
  return `https://www.google.com/maps/dir/?${p.toString()}`;
}
