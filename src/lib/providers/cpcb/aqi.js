// CPCB real-time AQI via data.gov.in (PRD 12.2.3). Needs DATA_GOV_IN_API_KEY
// (free registration); without it the snapshot uses the computed AQI.
// VERIFY the resource id on data.gov.in before release; override with
// CPCB_RESOURCE_ID.

import { naqiFromPollutants } from '../../mausam/indices/naqi.js';
import { haversineKm } from '../../mausam/geo.js';
import { fetchUpstream } from '../http.js';

const DEFAULT_RESOURCE = '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';
const POLLUTANT = { 'PM2.5': 'pm2_5', PM10: 'pm10', NO2: 'no2', SO2: 'so2', CO: 'co', OZONE: 'o3', NH3: 'nh3' };

/**
 * data.gov.in records (one row per station per pollutant) to stations with
 * a National AQI. Rows carry pollutant_avg in µg/m³, except CO in mg/m³.
 * Stations with fewer than three pollutants, or none of PM2.5/PM10, get no
 * AQI (CPCB rule). Pure.
 */
export function normaliseStations(records) {
  const byStation = new Map();
  for (const r of records || []) {
    const key = r.station;
    if (!key) continue;
    const s = byStation.get(key) || {
      station: r.station,
      city: r.city,
      state: r.state,
      lat: Number(r.latitude),
      lon: Number(r.longitude),
      lastUpdate: r.last_update,
      pollutants: {},
    };
    const p = POLLUTANT[String(r.pollutant_id).toUpperCase()];
    const v = Number(r.avg_value ?? r.pollutant_avg);
    if (p && Number.isFinite(v)) s.pollutants[p] = v;
    byStation.set(key, s);
  }
  return [...byStation.values()]
    .map((s) => ({ ...s, naqi: naqiFromPollutants(s.pollutants, { minPollutants: 3 }) }))
    .filter((s) => s.naqi && Number.isFinite(s.lat) && Number.isFinite(s.lon));
}

/** Nearest station within `maxKm`, or null. Pure. */
export function nearestStation(stations, place, maxKm = 25) {
  let best = null;
  for (const s of stations) {
    const d = haversineKm(place, s);
    if (d <= maxKm && (!best || d < best.d)) best = { s, d };
  }
  return best ? { ...best.s, distanceKm: Math.round(best.d * 10) / 10 } : null;
}

/** "30-09-2026 14:00:00" (IST) to ISO. */
export function parseCpcbTime(s) {
  const m = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})/.exec(s || '');
  return m ? `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00+05:30` : null;
}

export async function fetchCpcbAqi(place, { state, now = Date.now() } = {}) {
  const key = process.env.DATA_GOV_IN_API_KEY;
  if (!key) return { ok: false, reason: 'disabled' };
  const url = new URL(`https://api.data.gov.in/resource/${process.env.CPCB_RESOURCE_ID || DEFAULT_RESOURCE}`);
  url.search = new URLSearchParams({ 'api-key': key, format: 'json', limit: '2000', ...(state ? { 'filters[state]': state } : {}) }).toString();
  const r = await fetchUpstream(url.toString(), { provider: 'cpcb', revalidate: 1800, timeoutMs: 6000 });
  if (!r.ok) return r;
  const station = nearestStation(normaliseStations(r.data?.records), place);
  if (!station) return { ok: false, reason: 'no_station' };
  const updatedAt = parseCpcbTime(station.lastUpdate);
  // Edge case E10: a station silent for over 3 hours is not used.
  if (updatedAt && now - Date.parse(updatedAt) > 3 * 3600e3) return { ok: false, reason: 'stale_station' };
  return {
    ok: true,
    data: {
      aqi: station.naqi.aqi,
      category: station.naqi.category,
      dominant: station.naqi.dominant,
      pm25: station.pollutants.pm2_5 ?? null,
      pm10: station.pollutants.pm10 ?? null,
      method: 'cpcb',
      stationName: station.station,
      stationDistanceKm: station.distanceKm,
      updatedAt,
      hourly: [],
    },
  };
}
