// Open-Meteo marine adapter (PRD 12.2.2). Verified 30 Sep 2026 that
// sea_level_height_msl is returned for Indian coasts (Calangute, Goa), so
// tides are derived from it. Where it is missing, tides stay empty; the app
// never guesses tide times.

import { tideExtrema } from '../../mausam/indices/seaSafety.js';
import { fetchUpstream } from '../http.js';
import { baseUrl, col, formatOffset, withOffset } from './common.js';

export function marineUrl({ lat, lon }) {
  const url = new URL(baseUrl('marine'));
  url.search = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    timezone: 'auto',
    past_hours: '6',
    forecast_hours: '72',
    hourly: 'wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_period,sea_surface_temperature,sea_level_height_msl',
  }).toString();
  return url.toString();
}

export async function fetchMarine({ lat, lon }) {
  const r = await fetchUpstream(marineUrl({ lat, lon }), { provider: 'open-meteo-marine', revalidate: 1800 });
  if (!r.ok) return r;
  const marine = normaliseMarine(r.data);
  return marine ? { ok: true, data: marine } : { ok: false, reason: 'no_data' };
}

/** Pure. Returns null when the point has no sea data (inland). */
export function normaliseMarine(j) {
  const H = j?.hourly;
  if (!H?.time?.length) return null;
  const offset = formatOffset(j.utc_offset_seconds ?? 0);
  const hourly = H.time.map((t, i) => ({
    time: withOffset(t, offset),
    waveM: col(H, 'wave_height', i),
    swellM: col(H, 'swell_wave_height', i),
    swellPeriodS: col(H, 'swell_wave_period', i),
    wavePeriodS: col(H, 'wave_period', i),
    waveDirDeg: col(H, 'wave_direction', i),
    sstC: col(H, 'sea_surface_temperature', i),
    seaLevelM: col(H, 'sea_level_height_msl', i),
  }));
  if (hourly.every((h) => h.waveM == null)) return null;
  return { hourly, tides: tideExtrema(hourly.map(({ time, seaLevelM }) => ({ time, seaLevelM }))) };
}
