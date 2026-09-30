// Builders for weather fixtures used by the rule and index tests.
// Not a test file itself (the runner only picks up tests/*.test.mjs).

import { buildContext } from '../../src/lib/mausam/rules/index.js';
import { addDays } from '../../src/lib/mausam/time.js';

export const OFF = '+05:30';
export const at = (date, hh, mm = 0) =>
  `${date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00${OFF}`;

export const DATE = '2026-09-29';

/** A calm, comfortable hour. */
export function baseHour(time) {
  const hr = Number(time.slice(11, 13));
  return {
    time,
    tempC: 24,
    feelsC: 24,
    rh: 55,
    dewPointC: 15,
    precipProb: 0,
    precipMm: 0,
    wmo: 1,
    cloudPct: 20,
    visibilityM: 10000,
    windKmh: 8,
    gustKmh: 12,
    windDirDeg: 270,
    uv: hr >= 7 && hr <= 17 ? 3 : 0,
    isDay: hr >= 6 && hr < 18,
    aqi: null,
    soil: { m0_1: 0.3, m3_9: 0.3, m9_27: 0.3, t0: 22 },
  };
}

/**
 * Hourly records from `startDate` 00:00 for `days` days.
 * `patch(hour, localHour, date)` returns overrides or nothing.
 */
export function hours({ startDate = addDays(DATE, -1), days = 4, patch } = {}) {
  const out = [];
  for (let d = 0; d < days; d++) {
    const date = addDays(startDate, d);
    for (let h = 0; h < 24; h++) {
      const base = baseHour(at(date, h));
      out.push({ ...base, ...(patch ? patch(base, h, date) || {} : {}) });
    }
  }
  return out;
}

export function days({ startDate = addDays(DATE, -1), count = 17, patch } = {}) {
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(startDate, i);
    const base = {
      date,
      maxC: 30,
      minC: 20,
      feelsMaxC: 31,
      precipMm: 0,
      precipProbMax: 5,
      wmo: 1,
      windMaxKmh: 12,
      gustMaxKmh: 20,
      uvMax: 6,
      sunrise: at(date, 6, 10),
      sunset: at(date, 18, 5),
      source: 'fixture',
    };
    return { ...base, ...(patch ? patch(base, i, date) || {} : {}) };
  });
}

export function snapshot(over = {}) {
  return {
    place: { id: 'home', name: 'Lucknow', lat: 26.85, lon: 80.95, state: 'Uttar Pradesh' },
    utcOffsetSeconds: 19800,
    hourly: hours(),
    daily: days(),
    air: { aqi: 60, category: 'satisfactory', dominant: 'pm10', pm25: 25, pm10: 70, method: 'fixture', hourly: [] },
    marine: null,
    warnings: [],
    ...over,
  };
}

export function warning(over = {}) {
  return {
    id: 'w1',
    source: 'imd_district',
    hazard: 'heavy_rain',
    level: 3,
    title: 'Heavy rain',
    text: 'Heavy rain very likely at isolated places.',
    area: 'Lucknow',
    issuedAt: at(DATE, 8, 30),
    validFrom: at(DATE, 8, 30),
    validTo: at(addDays(DATE, 1), 8, 30),
    issuer: 'IMD Meteorological Centre Lucknow',
    lang: 'en',
    ...over,
  };
}

/** Rule context at `now` (default 29 Sep 2026, 10:00 IST). */
export function ctx({ now = at(DATE, 10), snap, personas = ['citizen'], ...rest } = {}) {
  return buildContext({ now, snapshot: snap || snapshot(), personas, ...rest });
}
