/**
 * Demo scenarios (PRD section 24). Each builds a WeatherSnapshot with
 * isDemo: true, with every time generated relative to `now`, so a scenario
 * always looks current. Warnings in these fixtures are labelled demo copies
 * of the IMD and NDMA formats; they are never shown as live warnings.
 *
 * Load with ?demo=<id> or Settings > Demo scenarios (NEXT_PUBLIC_DEMO_MODE).
 */

import { isoAt, localParts, addDays, instantOf } from '../../lib/mausam/time.js';
import { feelsLikeC } from '../../lib/mausam/indices/heatIndex.js';
import { categoryOf } from '../../lib/mausam/indices/naqi.js';
import { tideExtrema } from '../../lib/mausam/indices/seaSafety.js';
import { sunTimes } from '../../lib/mausam/sun.js';
import { roundToGrid } from '../../lib/mausam/geo.js';

const OFF = 330;
const HOUR = 3600e3;

/** Diurnal curve: minimum at 06:00, maximum at 15:00, linear in between. */
function diurnal(hour, min, max) {
  const rising = hour >= 6 && hour <= 15;
  const phase = rising ? (hour - 6) / 9 : hour > 15 ? 1 - (hour - 15) / 15 : 1 - (hour + 9) / 15;
  return Math.round((min + (max - min) * phase) * 10) / 10;
}

const DEF = {
  'delhi-winter-smog-fog': {
    place: { id: 'demo-delhi', name: 'New Delhi', lat: 28.61, lon: 77.21, district: 'New Delhi', state: 'Delhi', isCoastal: false },
    month: 1,
    hour: (h) => ({
      tempC: diurnal(h, 7, 20),
      rh: h < 11 ? 92 : 60,
      visibilityM: h >= 2 && h < 10 ? (h < 8 ? 120 : 180) : h < 11 ? 900 : 1500,
      wmo: h >= 2 && h < 10 ? 45 : 3,
      windKmh: 4,
      gustKmh: 8,
      windDirDeg: 315,
      uv: h >= 10 && h <= 15 ? 2 : 0,
      aqi: h >= 5 && h <= 8 ? 380 : h >= 13 && h <= 16 ? 290 : 350,
    }),
    day: () => ({ maxC: 20, minC: 7, wmo: 45, precipProbMax: 0, uvMax: 3 }),
    air: { aqi: 356, pm25: 205, pm10: 330, dominant: 'pm2_5' },
    warnings: [
      { hazard: 'dense_fog', level: 3, from: -6, to: 4, text: 'Dense fog very likely in the morning hours. (Demo of IMD warning format)' },
      { hazard: 'cold_day', level: 2, from: -6, to: 14, text: 'Cold day conditions likely. (Demo of IMD warning format)' },
    ],
    reports: [
      { type: 'fog', label: 'dense', area: 'Ring Road, Dhaula Kuan', dLat: 0.0, dLon: -0.05, minutes: 20 },
      { type: 'fog', label: 'dense', area: 'NH-48, Mahipalpur', dLat: -0.06, dLon: -0.08, minutes: 35 },
      { type: 'fog', label: 'dense', area: 'Ring Road, Ashram', dLat: -0.04, dLon: 0.05, minutes: 50 },
    ],
  },
  'mumbai-monsoon-red': {
    place: { id: 'demo-mumbai', name: 'Mumbai', lat: 19.08, lon: 72.88, district: 'Mumbai', state: 'Maharashtra', isCoastal: true },
    month: 7,
    hour: () => ({ tempC: 27, rh: 94, precipProb: 95, precipMm: 9, wmo: 65, windKmh: 30, gustKmh: 55, windDirDeg: 225, visibilityM: 2000, uv: 1 }),
    day: (i) => ({ maxC: 29, minC: 25, wmo: 65, precipMm: i === 0 ? 210 : i === 1 ? 120 : 40, precipProbMax: 95, gustMaxKmh: 60, uvMax: 2 }),
    air: { aqi: 42, pm25: 18, pm10: 40, dominant: 'pm10' },
    marine: { waveM: 3.4, swellM: 2.1, swellPeriodS: 12, sstC: 28 },
    warnings: [
      { hazard: 'extremely_heavy_rain', level: 4, from: -6, to: 18, text: 'Extremely heavy rainfall very likely at isolated places. (Demo of IMD warning format)' },
      { hazard: 'heavy_rain', level: 3, from: 18, to: 42, text: 'Heavy to very heavy rainfall likely. (Demo of IMD warning format)' },
      { hazard: 'high_waves', level: 3, source: 'imd_marine', from: -6, to: 30, text: 'High waves of 3.0 to 4.0 m likely along the Mumbai coast. (Demo of IMD warning format)' },
      { hazard: 'flood', level: 3, source: 'ndma_cap', from: -3, to: 24, text: 'Urban flooding likely in low-lying areas. Avoid subways and underpasses. (Demo of NDMA SACHET format)', issuer: 'Maharashtra SDMA' },
    ],
    reports: [
      ['Andheri Subway', 0.04, -0.03, 2, 'community_verified', 25, 3],
      ['Milan Subway, Santacruz', 0.0, -0.04, 4, 'community_verified', 40, 5],
      ['Hindmata, Dadar', -0.07, -0.04, 2, 'ai_verified', 15, 1],
      ['Sion Circle', -0.04, -0.02, 3, 'ai_verified', 55, 2],
      ['Kurla West', -0.01, 0.0, 1, 'unverified', 10, 0],
      ["King's Circle", -0.055, -0.02, 2, 'community_verified', 70, 4],
      ['Bandra Kalanagar', -0.02, -0.04, 1, 'ai_verified', 30, 0],
    ].map(([area, dLat, dLon, severity, status, minutes, confirmations]) => ({ type: 'waterlogging', label: 'flooded_street', area, dLat, dLon, severity, status, minutes, confirmations }))
      .concat([{ type: 'sky', label: 'Cb', area: 'Powai, JVLR', dLat: 0.04, dLon: 0.03, minutes: 12 }]),
  },
  'chennai-cyclone': {
    place: { id: 'demo-chennai', name: 'Chennai', lat: 13.08, lon: 80.27, district: 'Chennai', state: 'Tamil Nadu', isCoastal: true },
    month: 11,
    hour: () => ({ tempC: 26, rh: 92, precipProb: 90, precipMm: 12, wmo: 82, windKmh: 55, gustKmh: 80, windDirDeg: 45, visibilityM: 1500, uv: 1 }),
    day: (i) => ({ maxC: 28, minC: 24, wmo: 82, precipMm: i < 2 ? 150 : 30, precipProbMax: 95, gustMaxKmh: 85, uvMax: 1 }),
    air: { aqi: 35, pm25: 12, pm10: 35, dominant: 'pm10' },
    marine: { waveM: 5.5, swellM: 3.2, swellPeriodS: 13, sstC: 28 },
    warnings: [
      { hazard: 'cyclone', level: 4, from: -6, to: 30, text: 'Cyclonic storm about 180 km southeast, moving northwest at 12 km/h; landfall near Mahabalipuram expected in about 14 hours. (Demo of IMD warning format)' },
      { hazard: 'high_waves', level: 4, source: 'imd_marine', from: -6, to: 72, text: 'Fishermen are advised not to venture into the sea for the next 3 days. (Demo of IMD warning format)' },
    ],
    cyclone: { name: 'Demo', distanceKm: 180, landfallInHours: 14, heading: 'NW', speedKmh: 12 },
    reports: [],
  },
  'lucknow-heatwave': {
    place: { id: 'demo-lucknow', name: 'Lucknow', lat: 26.85, lon: 80.95, district: 'Lucknow', state: 'Uttar Pradesh', isCoastal: false },
    month: 5,
    hour: (h) => ({ tempC: diurnal(h, 32, 46), rh: 30, windKmh: 18, gustKmh: 30, windDirDeg: 270, uv: h >= 7 && h <= 17 ? Math.min(11, Math.round(11 - Math.abs(12.5 - h) * 1.6)) : 0, wmo: 0, visibilityM: 6000 }),
    day: () => ({ maxC: 46, minC: 32, wmo: 0, precipProbMax: 0, uvMax: 11 }),
    air: { aqi: 185, pm25: 70, pm10: 230, dominant: 'pm10' },
    warnings: [
      { hazard: 'heat_wave', level: 3, from: -6, to: 42, text: 'Heat wave conditions very likely at isolated places. (Demo of IMD warning format)' },
      { hazard: 'warm_night', level: 2, from: 6, to: 18, text: 'Warm night conditions likely. (Demo of IMD warning format)' },
    ],
    reports: [],
  },
  'punjab-village-frost': {
    place: { id: 'demo-bathinda', name: 'Village near Bathinda', lat: 30.21, lon: 74.95, district: 'Bathinda', state: 'Punjab', isCoastal: false, rural: true },
    month: 1,
    hour: (h) => ({ tempC: diurnal(h, 1, 18), rh: 70, windKmh: 3, gustKmh: 6, cloudPct: 5, wmo: 0, uv: h >= 10 && h <= 15 ? 3 : 0, visibilityM: 8000, soil: { m0_1: 0.28, m3_9: 0.3, m9_27: 0.31, t0: 8 } }),
    day: () => ({ maxC: 18, minC: 1, wmo: 0, precipProbMax: 0, uvMax: 4 }),
    air: { aqi: 140, pm25: 70, pm10: 150, dominant: 'pm2_5' },
    warnings: [{ hazard: 'ground_frost', level: 2, from: 6, to: 20, text: 'Ground frost likely at isolated places. (Demo of IMD warning format)' }],
    agromet: 'Light irrigation in wheat to protect from frost; cover nurseries. (Demo of agromet advisory format)',
    reports: [],
  },
  'goa-swell-alert': {
    place: { id: 'demo-calangute', name: 'Calangute', lat: 15.54, lon: 73.76, district: 'North Goa', state: 'Goa', isCoastal: true },
    month: 10,
    hour: (h) => ({ tempC: diurnal(h, 25, 31), rh: 75, windKmh: 22, gustKmh: 30, windDirDeg: 270, uv: h >= 7 && h <= 17 ? Math.min(10, Math.round(10 - Math.abs(12.5 - h) * 1.5)) : 0, wmo: 1 }),
    day: () => ({ maxC: 31, minC: 25, wmo: 1, precipProbMax: 10, uvMax: 10 }),
    air: { aqi: 48, pm25: 15, pm10: 45, dominant: 'pm10' },
    marine: { waveM: 1.8, swellM: 1.4, swellPeriodS: 14, sstC: 29, tides: true },
    warnings: [
      { hazard: 'high_waves', level: 3, source: 'imd_marine', from: -6, to: 30, text: 'Swell surge alert: long-period swells likely along the Goa coast. (Demo of INCOIS alert format)', issuer: 'INCOIS (demo)' },
      { hazard: 'strong_wind', level: 2, from: -6, to: 18, text: 'Strong winds likely along the coast. (Demo of IMD coastal bulletin format)' },
    ],
    reports: [],
  },
};

export const SCENARIO_IDS = Object.freeze(Object.keys(DEF));

export function isScenario(id) {
  return Object.prototype.hasOwnProperty.call(DEF, id);
}

function baseHour() {
  return { rh: 60, precipProb: 0, precipMm: 0, wmo: 1, cloudPct: 30, visibilityM: 10000, windKmh: 8, gustKmh: 12, windDirDeg: 270, uv: 0, aqi: null, soil: null };
}

/**
 * Build a scenario snapshot. The scenario's month is shown through its
 * weather, but the clock is the real `now`, so "in 3 hours" stays true.
 */
export function buildScenario(id, now = Date.now()) {
  const s = DEF[id];
  if (!s) return null;
  const nowMs = typeof now === 'number' ? now : new Date(now).getTime();
  const startMs = nowMs - (nowMs % HOUR) - 12 * HOUR;
  const hourly = [];
  for (let k = 0; k < 60; k++) {
    const t = startMs + k * HOUR;
    const h = localParts(t, OFF).hour;
    const raw = { ...baseHour(), ...s.hour(h) };
    const isDay = h >= 6 && h < 18;
    hourly.push({
      time: isoAt(t, OFF),
      tempC: raw.tempC,
      feelsC: feelsLikeC({ tempC: raw.tempC, rh: raw.rh, apparentC: raw.tempC }),
      rh: raw.rh,
      dewPointC: null,
      precipProb: raw.precipProb,
      precipMm: raw.precipMm,
      wmo: raw.wmo,
      cloudPct: raw.cloudPct,
      visibilityM: raw.visibilityM,
      windKmh: raw.windKmh,
      gustKmh: raw.gustKmh,
      windDirDeg: raw.windDirDeg,
      uv: raw.uv,
      isDay,
      aqi: raw.aqi ?? s.air?.aqi ?? null,
      soil: raw.soil ?? null,
    });
  }
  const today = localParts(nowMs, OFF).date;
  const daily = Array.from({ length: 16 }, (_, i) => {
    const date = addDays(today, i);
    const d = s.day(i);
    const sun = sunTimes(s.place.lat, s.place.lon, instantOf(date, '12:00', OFF), OFF);
    return {
      date,
      maxC: d.maxC,
      minC: d.minC,
      feelsMaxC: feelsLikeC({ tempC: d.maxC, rh: 50, apparentC: d.maxC }),
      precipMm: d.precipMm ?? 0,
      precipProbMax: d.precipProbMax ?? 0,
      wmo: d.wmo,
      windMaxKmh: 15,
      gustMaxKmh: d.gustMaxKmh ?? 25,
      uvMax: d.uvMax ?? 5,
      sunrise: sun.sunrise,
      sunset: sun.sunset,
      source: 'fixture',
    };
  });
  const cur = hourly[12];
  const at = (hoursFromNow) => isoAt(nowMs + hoursFromNow * HOUR, OFF);

  let marine = null;
  if (s.marine) {
    const m = s.marine;
    const mh = hourly.map((h, k) => ({
      time: h.time,
      waveM: m.waveM,
      swellM: m.swellM,
      swellPeriodS: m.swellPeriodS,
      wavePeriodS: m.swellPeriodS - 2,
      waveDirDeg: 250,
      sstC: m.sstC,
      // Semi-diurnal tide curve only where the scenario says tide data exists.
      seaLevelM: m.tides ? Math.round(Math.cos(((startMs + k * HOUR) / HOUR) * ((2 * Math.PI) / 12.42)) * 80) / 100 : null,
    }));
    marine = { hourly: mh, tides: tideExtrema(mh) };
  }

  const warnings = (s.warnings || []).map((w, i) => ({
    id: `demo-${id}-${i}`,
    source: w.source || 'imd_district',
    hazard: w.hazard,
    level: w.level,
    title: w.hazard,
    text: w.text,
    instruction: null,
    area: s.place.district,
    issuedAt: at(w.from),
    validFrom: at(w.from),
    validTo: at(w.to),
    issuer: w.issuer || 'India Meteorological Department (demo)',
    lang: 'en',
    demo: true,
  }));

  return {
    place: { ...s.place, timezone: 'Asia/Kolkata' },
    utcOffsetSeconds: OFF * 60,
    current: {
      time: cur.time,
      tempC: cur.tempC,
      feelsC: cur.feelsC,
      rh: cur.rh,
      wmo: cur.wmo,
      windKmh: cur.windKmh,
      gustKmh: cur.gustKmh,
      windDirDeg: cur.windDirDeg,
      visibilityM: cur.visibilityM,
      uv: cur.uv,
      isDay: cur.isDay,
      source: 'fixture',
      updatedAt: isoAt(nowMs, OFF),
    },
    hourly,
    daily,
    air: s.air
      ? { ...s.air, category: categoryOf(s.air.aqi), method: 'fixture', updatedAt: isoAt(nowMs, OFF), hourly: hourly.map((h) => ({ time: h.time, aqi: h.aqi })) }
      : null,
    marine,
    warnings,
    warningsStatus: 'ok',
    sun: sunTimes(s.place.lat, s.place.lon, nowMs, OFF),
    agromet: s.agromet ? { text: s.agromet, issuer: 'IMD/ICAR (demo)', issuedAt: at(-4) } : null,
    cyclone: s.cyclone || null,
    sources: [{ name: 'demo', fields: ['all'], updatedAt: isoAt(nowMs, OFF) }],
    scenario: id,
    isDemo: true,
    fetchedAt: new Date(nowMs).toISOString(),
  };
}

/** Seeded crowd reports for a scenario (PRD 26.4), marked demo. */
export function scenarioReports(id, now = Date.now()) {
  const s = DEF[id];
  if (!s) return [];
  const nowMs = typeof now === 'number' ? now : new Date(now).getTime();
  return (s.reports || []).map((r, i) => {
    const observed = nowMs - r.minutes * 60000;
    const ttl = r.type === 'waterlogging' ? 3 : r.type === 'fog' ? 2 : 1;
    return {
      id: `demo-${id}-r${i}`,
      type: r.type,
      label: r.label,
      confidence: r.status === 'unverified' ? 0.6 : 0.88,
      severity: r.severity ?? null,
      lat: roundToGrid(s.place.lat + r.dLat),
      lon: roundToGrid(s.place.lon + r.dLon),
      areaName: r.area,
      status: r.status || 'ai_verified',
      confirmations: r.confirmations ?? 0,
      clears: 0,
      observedAt: new Date(observed).toISOString(),
      expiresAt: new Date(observed + ttl * HOUR).toISOString(),
      modelVersion: 'demo',
      demo: true,
    };
  });
}
