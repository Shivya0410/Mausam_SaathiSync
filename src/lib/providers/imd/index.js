// IMD adapter (PRD 12.2.1). Behind IMD_API_ENABLED, off by default.
//
// Verified 30 Sep 2026: IMD's API answers "IP ... needs to be whitelisted"
// (HTTP 401) to unlisted callers, and serverless hosts have no fixed IP.
// Set IMD_PROXY_BASE_URL to a static-IP proxy that IMD has whitelisted, or
// leave IMD disabled and the app says "Official IMD feed not connected".
// Never scrape IMD web pages.

import { fetchUpstream } from '../http.js';
import { DISTRICT_WARNING_CODES, districtColourToLevel, nowcastColourToLevel, nowcastHazard } from './warningCodes.js';
import { addDays } from '../../mausam/time.js';

export function imdEnabled() {
  return process.env.IMD_API_ENABLED === 'true';
}

function base() {
  return (process.env.IMD_PROXY_BASE_URL || process.env.IMD_API_BASE_URL || 'https://api.imd.gov.in').replace(/\/$/, '');
}

const clean = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Find the IMD district record for a place by id, else by name. */
export function matchDistrict(records, { districtId, district }) {
  if (districtId) {
    const hit = records.find((r) => String(r.Obj_id ?? r.OBJ_ID ?? r.id) === String(districtId));
    if (hit) return hit;
  }
  if (!district) return null;
  const want = clean(district);
  return records.find((r) => clean(r.District) === want) || null;
}

/**
 * District warnings for 5 days to Warning[] (one per hazard per day). Pure.
 * `record`: { Obj_id, Date, UTC, District, Day_1..Day_5, Day1_Color..Day5_Color }
 */
export function normaliseDistrictWarnings(record) {
  if (!record) return [];
  const issueDate = String(record.Date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) return [];
  const utc = /^\d{2}:?\d{2}/.test(record.UTC || '') ? String(record.UTC).replace(':', '').slice(0, 4) : '0300';
  const issuedAt = new Date(`${issueDate}T${utc.slice(0, 2)}:${utc.slice(2, 4)}:00Z`).toISOString();
  const out = [];
  for (let d = 1; d <= 5; d++) {
    const level = districtColourToLevel(record[`Day${d}_Color`]);
    if (!level || level < 2) continue;
    const date = addDays(issueDate, d - 1);
    const codes = String(record[`Day_${d}`] || '')
      .split(',')
      .map((c) => Number(c.trim()))
      .filter((c) => c && c !== 1);
    for (const code of codes) {
      const hazard = DISTRICT_WARNING_CODES[code];
      if (!hazard) continue;
      out.push({
        id: `imd-${record.Obj_id ?? record.District}-${date}-${hazard}`,
        source: 'imd_district',
        hazard,
        level,
        title: hazard,
        text: '',
        area: record.District,
        issuedAt,
        validFrom: `${date}T00:00:00+05:30`,
        validTo: `${date}T23:59:59+05:30`,
        issuer: 'India Meteorological Department',
        lang: 'en',
        day: d,
      });
    }
  }
  return out;
}

/**
 * District nowcast to a Warning (or null when there is no weather). Pure.
 * `record`: { Date, toi: 'HHmm', Vupto: 'HHmm', color, message, Cat1..Cat19 }
 */
export function normaliseNowcast(record, areaName) {
  if (!record) return null;
  const level = nowcastColourToLevel(record.color);
  if (!level || level < 2) return null;
  const cats = Object.entries(record)
    .filter(([k, v]) => /^Cat\d+$/.test(k) && v !== '' && v != null && k !== 'Cat16')
    .map(([, v]) => Number(v))
    .filter(Number.isFinite);
  const date = String(record.Date || '').slice(0, 10);
  const hhmm = (s) => (/^\d{3,4}$/.test(String(s || '')) ? String(s).padStart(4, '0') : null);
  const toi = hhmm(record.toi);
  const upto = hhmm(record.Vupto);
  const at = (t) => (date && t ? `${date}T${t.slice(0, 2)}:${t.slice(2)}:00+05:30` : null);
  let validTo = at(upto);
  if (validTo && at(toi) && Date.parse(validTo) < Date.parse(at(toi))) {
    validTo = `${addDays(date, 1)}T${upto.slice(0, 2)}:${upto.slice(2)}:00+05:30`;
  }
  return {
    id: `imd-nowcast-${areaName}-${date}-${toi}`,
    source: 'imd_nowcast',
    hazard: nowcastHazard(cats) || 'thunderstorm',
    level,
    title: 'nowcast',
    text: String(record.message || '').trim(),
    area: areaName,
    issuedAt: at(toi),
    validFrom: at(toi),
    validTo,
    issuer: 'India Meteorological Department',
    lang: 'en',
  };
}

/** Warning[] for a place, or { ok: false } when disabled or unreachable. */
export async function fetchImdWarnings({ district, districtId }) {
  if (!imdEnabled()) return { ok: false, reason: 'disabled' };
  const [dw, nc] = await Promise.all([
    fetchUpstream(`${base()}/api/v1/districtwarning`, { provider: 'imd', revalidate: 300 }),
    fetchUpstream(`${base()}/api/v1/districtnowcast`, { provider: 'imd', revalidate: 180 }),
  ]);
  if (!dw.ok && !nc.ok) return { ok: false, reason: dw.reason };
  const list = (r) => (Array.isArray(r.data) ? r.data : Array.isArray(r.data?.data) ? r.data.data : []);
  const warnings = [];
  if (dw.ok) warnings.push(...normaliseDistrictWarnings(matchDistrict(list(dw), { districtId, district })));
  if (nc.ok) {
    const rec = matchDistrict(list(nc).map((r) => ({ ...r, District: r.District ?? r.Station })), { districtId, district });
    const w = normaliseNowcast(rec, district);
    if (w) warnings.push(w);
  }
  return { ok: true, data: warnings, partial: !dw.ok || !nc.ok, matched: warnings.length > 0 || Boolean(district) };
}
