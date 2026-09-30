// Climatology from the Open-Meteo archive (ERA5) for events beyond the
// 16-day forecast (PRD 6.6.4, 13.3). "Based on past years, not a forecast."

import { fetchUpstream } from '../http.js';
import { baseUrl } from './common.js';
import { addDays } from '../../mausam/time.js';

/**
 * Same calendar date ± window days in each of the last `years` years.
 * Skips invalid dates (29 February in non-leap years) (edge case E24).
 */
export function climatologyWindows(month, day, { years = 10, window = 3, currentYear }) {
  const out = [];
  for (let y = currentYear - years; y < currentYear; y++) {
    const center = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const parsed = new Date(`${center}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== center) continue;
    out.push({ year: y, start: addDays(center, -window), end: addDays(center, window) });
  }
  return out;
}

/** Summarise per-year daily records. Pure. */
export function summariseClimatology(perYear) {
  const all = perYear.flatMap((y) => y.days);
  const mean = (k) => {
    const v = all.map((d) => d[k]).filter(Number.isFinite);
    return v.length ? Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10 : null;
  };
  return {
    yearsCounted: perYear.length,
    rainyYears: perYear.filter((y) => y.days.some((d) => d.precipMm >= 2.5)).length,
    typicalMaxC: mean('maxC'),
    typicalMinC: mean('minC'),
    typicalGustKmh: mean('gustKmh'),
  };
}

export async function fetchClimatology({ lat, lon, month, day, years = 10, window = 3, currentYear }) {
  const wins = climatologyWindows(month, day, { years, window, currentYear });
  if (!wins.length) return { ok: false, reason: 'invalid_date' };
  const url = new URL(baseUrl('archive'));
  url.search = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    start_date: wins[0].start,
    end_date: wins[wins.length - 1].end,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max',
    timezone: 'auto',
  }).toString();
  const r = await fetchUpstream(url.toString(), { provider: 'open-meteo-archive', revalidate: 30 * 24 * 3600, timeoutMs: 8000 });
  if (!r.ok) return r;
  const D = r.data?.daily;
  if (!D?.time) return { ok: false, reason: 'bad_payload' };
  const rows = D.time.map((date, i) => ({
    date,
    maxC: D.temperature_2m_max?.[i],
    minC: D.temperature_2m_min?.[i],
    precipMm: D.precipitation_sum?.[i] ?? 0,
    gustKmh: D.wind_gusts_10m_max?.[i],
  }));
  const perYear = wins.map((w) => ({ year: w.year, days: rows.filter((d) => d.date >= w.start && d.date <= w.end) }));
  return { ok: true, data: summariseClimatology(perYear.filter((y) => y.days.length)) };
}
