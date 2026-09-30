// Open-Meteo air quality adapter with Indian National AQI computed from the
// trailing 24-hour mean of model PM2.5 and PM10 (PRD 6.6.2, 12.2.2).
// Labelled "Estimated from model data": CPCB uses station 24 h averages.

import { naqiFromPm, trailingMean } from '../../mausam/indices/naqi.js';
import { fetchUpstream } from '../http.js';
import { baseUrl, col, formatOffset, withOffset } from './common.js';

export function airUrl({ lat, lon }) {
  const url = new URL(baseUrl('air'));
  url.search = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    timezone: 'auto',
    past_days: '1',
    forecast_days: '3',
    hourly: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust',
  }).toString();
  return url.toString();
}

export async function fetchAirQuality({ lat, lon }, now = Date.now()) {
  const r = await fetchUpstream(airUrl({ lat, lon }), { provider: 'open-meteo-air', revalidate: 1800 });
  if (!r.ok) return r;
  const air = normaliseAir(r.data, now);
  return air ? { ok: true, data: air } : { ok: false, reason: 'no_data' };
}

/**
 * Open-Meteo air JSON to AirQuality. Pure.
 * `now` picks the current hour; hourly AQI covers the past 12 h and next 48 h.
 */
export function normaliseAir(j, now = Date.now()) {
  const H = j?.hourly;
  if (!H?.time?.length) return null;
  const offset = formatOffset(j.utc_offset_seconds ?? 0);
  const times = H.time.map((t) => withOffset(t, offset));
  const pm25 = times.map((time, i) => ({ time, value: col(H, 'pm2_5', i) }));
  const pm10 = times.map((time, i) => ({ time, value: col(H, 'pm10', i) }));

  const aqiAt = (i) => naqiFromPm({ pm25: trailingMean(pm25, i), pm10: trailingMean(pm10, i) });
  let idx = times.findIndex((t) => Date.parse(t) > now) - 1;
  if (idx < 0) idx = times.length - 1;
  const cur = aqiAt(idx);
  if (!cur) return null;

  const hourly = [];
  for (let i = 0; i < times.length; i++) {
    const dt = Date.parse(times[i]) - now;
    if (dt < -12 * 3600e3 || dt > 48 * 3600e3) continue;
    const a = aqiAt(i);
    if (a) hourly.push({ time: times[i], aqi: a.aqi });
  }
  const round = (v) => (v == null ? null : Math.round(v));
  return {
    aqi: cur.aqi,
    category: cur.category,
    dominant: cur.dominant,
    pm25: round(trailingMean(pm25, idx)),
    pm10: round(trailingMean(pm10, idx)),
    method: 'computed',
    updatedAt: times[idx],
    hourly,
  };
}
