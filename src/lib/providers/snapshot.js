// Builds a WeatherSnapshot (PRD sections 12.1, 12.3, 12.5). Server only.
//
// Priority and fallback rules:
//   - Adapters run in parallel; each has a 4 second timeout.
//   - Forecast: Open-Meteo, else the last good snapshot for this place if
//     younger than 6 hours (stale: true), else demo fixture weather
//     (isDemo: true).
//   - Air: CPCB station within 25 km when a key is set, else AQI computed
//     from Open-Meteo PM data, else null ("not available").
//   - Warnings: IMD (when enabled) and NDMA SACHET. They NEVER fall back to
//     fixtures. If no official source answered, warningsStatus is
//     'unavailable' and the UI says "Couldn't check", never "No warnings".

import { fetchForecast } from './openMeteo/forecast.js';
import { fetchAirQuality } from './openMeteo/airQuality.js';
import { fetchMarine } from './openMeteo/marine.js';
import { nearestCity } from './openMeteo/geocoding.js';
import { fetchCpcbAqi } from './cpcb/aqi.js';
import { fetchImdWarnings, imdEnabled } from './imd/index.js';
import { fetchSachetWarnings, sachetFeeds } from './sachet/cap.js';
import { buildScenario, isScenario, SCENARIO_IDS } from '../../data/fixtures/scenarios.js';
import { sunTimes } from '../mausam/sun.js';
import { sharedCache } from '../../server/cache/lru.js';

const SNAPSHOT_TTL_MS = 5 * 60 * 1000;
const LAST_GOOD_MAX_MS = 6 * 3600 * 1000;

/** Rough bounding box for India; IMD and NDMA warnings apply only inside it. */
export function inIndia(lat, lon) {
  return lat >= 6 && lat <= 37.6 && lon >= 68 && lon <= 97.5;
}

/** Scenario whose place is nearest to the coordinates. */
export function nearestScenario(lat, lon, now) {
  let best = null;
  for (const id of SCENARIO_IDS) {
    const snap = buildScenario(id, now);
    const d = (snap.place.lat - lat) ** 2 + (snap.place.lon - lon) ** 2;
    if (!best || d < best.d) best = { id, snap, d };
  }
  return best.snap;
}

/**
 * Combine official warning results. Pure.
 * `warnings` are those for this place (cards, ribbon); `regionalWarnings`
 * are same-state warnings for other districts (Alerts page only).
 */
export function combineWarnings(results, { applicable }) {
  if (!applicable) return { warnings: [], regionalWarnings: [], warningsStatus: 'not_applicable' };
  const answered = results.filter((r) => r && r.ok);
  if (!answered.length) return { warnings: [], regionalWarnings: [], warningsStatus: 'unavailable' };
  const partial = answered.length < results.length || answered.some((r) => r.partial);
  const all = answered.flatMap((r) => r.data).sort((a, b) => b.level - a.level);
  return {
    warnings: all.filter((w) => (w.scope ?? 'place') === 'place'),
    regionalWarnings: all.filter((w) => w.scope === 'state'),
    warningsStatus: partial ? 'partial' : 'ok',
  };
}

/** Attach the air-quality hourly AQI to matching forecast hours. Pure. */
export function mergeHourlyAqi(hourly, air) {
  if (!air?.hourly?.length) return hourly;
  const byTime = new Map(air.hourly.map((h) => [Date.parse(h.time), h.aqi]));
  return hourly.map((h) => ({ ...h, aqi: byTime.get(Date.parse(h.time)) ?? h.aqi ?? null }));
}

function resolvePlace({ lat, lon, name, district, state }) {
  const city = nearestCity(lat, lon);
  return {
    id: `${lat.toFixed(2)},${lon.toFixed(2)}`,
    name: name || city?.name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    lat,
    lon,
    district: district || city?.name || null,
    state: state || city?.state || null,
    isCoastal: Boolean(city?.coastal),
  };
}

/** Official warnings for coordinates, without building a whole snapshot. */
export async function officialWarningsFor({ lat, lon, name, district, state, lang = 'en', now = Date.now() }) {
  const place = resolvePlace({ lat, lon, name, district, state });
  return { ...(await officialWarnings(place, { lang, now })), checkedAt: new Date(now).toISOString() };
}

async function officialWarnings(place, { lang, now }) {
  if (!inIndia(place.lat, place.lon)) return combineWarnings([], { applicable: false });
  const tasks = [];
  if (imdEnabled()) tasks.push(fetchImdWarnings({ district: place.district }));
  if (sachetFeeds().length) tasks.push(fetchSachetWarnings(place, { lang, now }));
  const results = await Promise.all(tasks);
  return combineWarnings(results, { applicable: true });
}

async function airFor(place, now) {
  const cpcb = await fetchCpcbAqi(place, { state: place.state, now });
  if (cpcb.ok) {
    // Station AQI for "now"; the model supplies the hourly trend line.
    const model = await fetchAirQuality(place, now);
    return { ...cpcb.data, hourly: model.ok ? model.data.hourly : [] };
  }
  const model = await fetchAirQuality(place, now);
  return model.ok ? model.data : null;
}

/**
 * @param {object} args
 * @param {number} args.lat rounded to 2 decimals by the route
 * @param {number} args.lon
 * @param {string[]} [args.include] air, marine, warnings, sun
 * @param {'en'|'hi'} [args.lang]
 * @param {string} [args.name] display name the client already knows
 * @param {string} [args.district]
 * @param {string} [args.state]
 * @param {string} [args.demo] scenario id
 * @param {number} [args.now]
 */
export async function buildSnapshot({ lat, lon, include = ['air', 'warnings', 'sun'], lang = 'en', name, district, state, demo, now = Date.now() }) {
  if (demo && isScenario(demo)) return buildScenario(demo, now);

  const place = resolvePlace({ lat, lon, name, district, state });
  const key = `${place.id}|${[...include].sort().join(',')}|${lang}|${place.district ?? ''}`;
  const cache = sharedCache('snapshot');
  const cached = cache.get(key, { now });
  if (cached) return cached;

  if (process.env.FORCE_FIXTURES === 'true') {
    const fx = nearestScenario(lat, lon, now);
    return { ...fx, place: { ...fx.place, ...place }, warnings: [], warningsStatus: 'unavailable', forcedFixtures: true };
  }

  const want = (k) => include.includes(k);
  const [forecast, air, marine, official] = await Promise.all([
    fetchForecast(place),
    want('air') ? airFor(place, now) : Promise.resolve(null),
    want('marine') ? fetchMarine(place) : Promise.resolve(null),
    want('warnings') ? officialWarnings(place, { lang, now }) : Promise.resolve({ warnings: [], regionalWarnings: [], warningsStatus: 'not_requested' }),
  ]);

  const fetchedAt = new Date(now).toISOString();
  if (!forecast.ok) {
    const lastGood = cache.get(`last:${place.id}`, { maxAgeMs: LAST_GOOD_MAX_MS, now });
    if (lastGood) return { ...lastGood, ...official, stale: true, fetchedAt };
    // No live or cached forecast: demo weather, clearly marked, with the
    // real official-warning result (never fixture warnings).
    const fx = nearestScenario(lat, lon, now);
    return {
      ...fx,
      place: { ...place, timezone: 'Asia/Kolkata' },
      ...official,
      marine: null,
      isDemo: true,
      scenario: null,
      fallbackReason: forecast.reason,
      fetchedAt,
    };
  }

  const f = forecast.data;
  const offsetMin = f.utcOffsetSeconds / 60;
  const sources = [{ name: 'open-meteo', fields: ['current', 'hourly', 'daily'], updatedAt: f.current?.updatedAt ?? fetchedAt }];
  if (air) sources.push({ name: air.method === 'cpcb' ? 'cpcb' : 'open-meteo-air', fields: ['air'], updatedAt: air.updatedAt ?? fetchedAt });
  if (marine?.ok) sources.push({ name: 'open-meteo-marine', fields: ['marine'], updatedAt: fetchedAt });
  for (const w of official.warnings) {
    if (!sources.some((s) => s.name === w.source)) sources.push({ name: w.source, fields: ['warnings'], updatedAt: w.issuedAt });
  }

  const snapshot = {
    place: { ...place, timezone: f.timezone, elevationM: f.elevationM, isCoastal: place.isCoastal || Boolean(marine?.ok) },
    utcOffsetSeconds: f.utcOffsetSeconds,
    current: f.current ? { ...f.current, aqi: air?.aqi ?? null } : null,
    hourly: mergeHourlyAqi(f.hourly, air),
    daily: f.daily,
    air,
    marine: marine?.ok ? marine.data : null,
    ...official,
    sun: want('sun') ? sunTimes(lat, lon, now, offsetMin) : null,
    sources,
    isDemo: false,
    fetchedAt,
  };
  cache.set(key, snapshot, SNAPSHOT_TTL_MS, now);
  cache.set(`last:${place.id}`, snapshot, LAST_GOOD_MAX_MS, now);
  return snapshot;
}
