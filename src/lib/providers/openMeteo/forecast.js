// Open-Meteo forecast adapter (PRD sections 12.2.2 and 27.6). Server only.
// Verified 30 Sep 2026: past_hours and forecast_hours combine with
// forecast_days (hourly returns past 12 + next 48; daily returns 16 days),
// and visibility and soil moisture are returned for Indian coordinates.

import { feelsLikeC } from '../../mausam/indices/heatIndex.js';
import { fetchUpstream } from '../http.js';
import { baseUrl, col, formatOffset, withOffset } from './common.js';

const HOURLY = [
  'temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'apparent_temperature',
  'precipitation_probability', 'precipitation', 'weather_code', 'cloud_cover', 'visibility',
  'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'uv_index', 'is_day',
  'soil_moisture_0_to_1cm', 'soil_moisture_3_to_9cm', 'soil_moisture_9_to_27cm', 'soil_temperature_0cm',
].join(',');

const DAILY = [
  'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'apparent_temperature_max',
  'precipitation_sum', 'precipitation_probability_max', 'wind_speed_10m_max',
  'wind_gusts_10m_max', 'uv_index_max', 'sunrise', 'sunset',
].join(',');

const CURRENT = [
  'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day', 'precipitation',
  'weather_code', 'cloud_cover', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
  'visibility', 'uv_index',
].join(',');

export function forecastUrl({ lat, lon }) {
  const url = new URL(baseUrl('forecast'));
  url.search = new URLSearchParams({
    latitude: lat.toFixed(2),
    longitude: lon.toFixed(2),
    timezone: 'auto',
    forecast_days: '16',
    past_hours: '12',
    forecast_hours: '48',
    hourly: HOURLY,
    daily: DAILY,
    current: CURRENT,
    wind_speed_unit: 'kmh',
  }).toString();
  return url.toString();
}

export async function fetchForecast({ lat, lon }) {
  const r = await fetchUpstream(forecastUrl({ lat, lon }), { provider: 'open-meteo', revalidate: 900 });
  if (!r.ok) return r;
  if (!r.data?.hourly?.time) return { ok: false, reason: 'bad_payload' };
  return { ok: true, data: normaliseForecast(r.data) };
}

const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10);

/** Open-Meteo forecast JSON to snapshot parts. Pure. */
export function normaliseForecast(j) {
  const offset = formatOffset(j.utc_offset_seconds ?? 0);
  const H = j.hourly || {};
  const hourly = (H.time || []).map((t, i) => {
    const tempC = col(H, 'temperature_2m', i);
    const rh = col(H, 'relative_humidity_2m', i);
    const hasSoil = H.soil_moisture_0_to_1cm != null && col(H, 'soil_moisture_0_to_1cm', i) != null;
    return {
      time: withOffset(t, offset),
      tempC,
      feelsC: feelsLikeC({ tempC, rh, apparentC: col(H, 'apparent_temperature', i) }),
      rh,
      dewPointC: col(H, 'dew_point_2m', i),
      precipProb: col(H, 'precipitation_probability', i, 0),
      precipMm: col(H, 'precipitation', i, 0),
      wmo: col(H, 'weather_code', i, 0),
      cloudPct: col(H, 'cloud_cover', i, 0),
      visibilityM: col(H, 'visibility', i),
      windKmh: col(H, 'wind_speed_10m', i, 0),
      gustKmh: col(H, 'wind_gusts_10m', i, 0),
      windDirDeg: col(H, 'wind_direction_10m', i, 0),
      uv: round1(col(H, 'uv_index', i, 0)),
      isDay: col(H, 'is_day', i, 1) === 1,
      aqi: null,
      soil: hasSoil
        ? {
            m0_1: col(H, 'soil_moisture_0_to_1cm', i),
            m3_9: col(H, 'soil_moisture_3_to_9cm', i),
            m9_27: col(H, 'soil_moisture_9_to_27cm', i),
            t0: col(H, 'soil_temperature_0cm', i),
          }
        : null,
    };
  });

  const D = j.daily || {};
  const daily = (D.time || []).map((d, i) => ({
    date: d,
    maxC: col(D, 'temperature_2m_max', i),
    minC: col(D, 'temperature_2m_min', i),
    feelsMaxC: col(D, 'apparent_temperature_max', i),
    precipMm: col(D, 'precipitation_sum', i, 0),
    precipProbMax: col(D, 'precipitation_probability_max', i, 0),
    wmo: col(D, 'weather_code', i, 0),
    windMaxKmh: col(D, 'wind_speed_10m_max', i, 0),
    gustMaxKmh: col(D, 'wind_gusts_10m_max', i, 0),
    uvMax: round1(col(D, 'uv_index_max', i, 0)),
    sunrise: withOffset(col(D, 'sunrise', i), offset),
    sunset: withOffset(col(D, 'sunset', i), offset),
    source: 'open-meteo',
  }));

  const C = j.current || {};
  const updatedAt = withOffset(C.time, offset);
  const current = C.time
    ? {
        time: updatedAt,
        tempC: C.temperature_2m,
        feelsC: feelsLikeC({ tempC: C.temperature_2m, rh: C.relative_humidity_2m, apparentC: C.apparent_temperature }),
        rh: C.relative_humidity_2m,
        wmo: C.weather_code,
        windKmh: C.wind_speed_10m,
        gustKmh: C.wind_gusts_10m,
        windDirDeg: C.wind_direction_10m,
        visibilityM: C.visibility ?? null,
        uv: round1(C.uv_index ?? 0),
        isDay: C.is_day === 1,
        source: 'open-meteo',
        updatedAt,
      }
    : null;

  return {
    timezone: j.timezone,
    utcOffsetSeconds: j.utc_offset_seconds ?? 0,
    elevationM: j.elevation ?? null,
    current,
    hourly,
    daily,
  };
}
