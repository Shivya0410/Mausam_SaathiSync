// Place search (PRD 12.2.2, T1.6). India first. Verified 30 Sep 2026:
// Devanagari names resolve ("लखनऊ" with language=hi); PIN codes do not, so
// numeric queries fall back to the bundled city list and otherwise return
// nothing, and the UI asks for a place name.

import { fetchUpstream } from '../http.js';
import { baseUrl } from './common.js';
import { CITIES } from '../../../data/cities.js';

function normalise(r) {
  return {
    id: String(r.id),
    name: r.name,
    admin1: r.admin1 ?? null,
    admin2: r.admin2 ?? null,
    country: r.country ?? null,
    countryCode: r.country_code ?? null,
    lat: Math.round(r.latitude * 10000) / 10000,
    lon: Math.round(r.longitude * 10000) / 10000,
    population: r.population ?? null,
    featureCode: r.feature_code ?? null,
    elevationM: r.elevation ?? null,
    timezone: r.timezone ?? null,
  };
}

/** Bundled fallback: quick-pick cities matched by English or Hindi name. */
export function searchBundled(q) {
  const needle = q.trim().toLowerCase();
  return CITIES.filter((c) => c.name.toLowerCase().startsWith(needle) || c.nameHi.startsWith(q.trim())).map((c) => ({
    id: `city-${c.id}`,
    name: c.name,
    admin1: c.state,
    admin2: null,
    country: 'India',
    countryCode: 'IN',
    lat: c.lat,
    lon: c.lon,
    population: null,
    featureCode: 'PPLA',
    elevationM: null,
    timezone: 'Asia/Kolkata',
  }));
}

/**
 * @returns {Promise<{ ok: true, data: Array, source: string } | { ok: false, reason: string }>}
 */
export async function searchPlaces(q, lang = 'en') {
  const query = q.trim();
  if (/^\d+$/.test(query)) return { ok: true, data: [], source: 'none', hint: 'place_name' };
  const url = new URL(baseUrl('geocoding'));
  url.search = new URLSearchParams({ name: query, count: '10', language: lang === 'hi' ? 'hi' : 'en', format: 'json' }).toString();
  const r = await fetchUpstream(url.toString(), { provider: 'open-meteo-geocoding', revalidate: 7 * 24 * 3600 });
  if (!r.ok) {
    const local = searchBundled(query);
    return local.length ? { ok: true, data: local, source: 'bundled' } : r;
  }
  const results = (r.data?.results || []).map(normalise);
  // India first, then by population.
  results.sort((a, b) => (b.countryCode === 'IN') - (a.countryCode === 'IN') || (b.population ?? 0) - (a.population ?? 0));
  return { ok: true, data: results, source: 'open-meteo' };
}

/** Nearest named place for coordinates, from the bundled city list. */
export function nearestCity(lat, lon) {
  let best = null;
  for (const c of CITIES) {
    const d = (c.lat - lat) ** 2 + (c.lon - lon) ** 2;
    if (!best || d < best.d) best = { c, d };
  }
  return best && best.d < 0.25 ? best.c : null;
}
