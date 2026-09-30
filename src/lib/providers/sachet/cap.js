// NDMA SACHET adapter: RSS index plus CAP 1.2 alerts (PRD 12.2.4).
//
// Verified 30 Sep 2026: the public India feed
// https://sachet.ndma.gov.in/cap_public_website/rss/rss_india.xml lists
// items whose <link> returns a CAP document (cap:alert with one cap:info per
// language, severity, expiry and cap:area/areaDesc). Enabled by setting
// SACHET_FEED_URLS (comma separated). CAP text is shown verbatim.

import { XMLParser } from 'fast-xml-parser';
import { fetchUpstream } from '../http.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: false,
});

const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const text = (v) => (v == null ? '' : typeof v === 'object' ? String(v['#text'] ?? '') : String(v)).trim();

/** RSS feed to [{ title, link, author, pubDate, guid }]. Pure. */
export function parseRss(xml) {
  const doc = parser.parse(xml);
  return arr(doc?.rss?.channel?.item).map((i) => ({
    title: text(i.title),
    link: text(i.link),
    author: text(i.author),
    pubDate: text(i.pubDate),
    guid: text(i.guid),
  }));
}

const SEVERITY_LEVEL = { extreme: 4, severe: 3, moderate: 2, minor: 2 };

/** CAP event text to our hazard id (best effort; unknown stays 'other'). */
export function capHazard(event) {
  const e = String(event || '').toLowerCase();
  if (/lightning|thunder/.test(e)) return 'thunderstorm';
  if (/cyclone/.test(e)) return 'cyclone';
  if (/high wave|swell|tidal|storm surge/.test(e)) return 'high_waves';
  if (/flood|inundation/.test(e)) return 'flood';
  if (/heat/.test(e)) return 'heat_wave';
  if (/cold/.test(e)) return 'cold_wave';
  if (/fog/.test(e)) return 'dense_fog';
  if (/dust/.test(e)) return 'dust_storm';
  if (/hail/.test(e)) return 'hailstorm';
  if (/rain/.test(e)) return 'heavy_rain';
  if (/wind|squall/.test(e)) return 'strong_wind';
  return 'other';
}

/**
 * CAP XML to Warning[] (one per alert, in the requested language when the
 * alert carries it, else English, else the first info block). Pure.
 */
export function parseCap(xml, { lang = 'en' } = {}) {
  const alert = parser.parse(xml)?.alert;
  if (!alert) return [];
  if (text(alert.status) && text(alert.status) !== 'Actual') return [];
  const infos = arr(alert.info);
  if (!infos.length) return [];
  const pick =
    infos.find((i) => text(i.language).toLowerCase().startsWith(lang)) ||
    infos.find((i) => text(i.language).toLowerCase().startsWith('en')) ||
    infos[0];
  const areas = arr(pick.area).map((a) => text(a.areaDesc)).filter(Boolean);
  const polygons = arr(pick.area).flatMap((a) => arr(a.polygon).map(text)).filter(Boolean);
  return [
    {
      id: `ndma-${text(alert.identifier)}`,
      source: 'ndma_cap',
      hazard: capHazard(text(pick.event)),
      level: SEVERITY_LEVEL[text(pick.severity).toLowerCase()] ?? 2,
      title: text(pick.event),
      text: text(pick.headline) + (text(pick.description) ? ` ${text(pick.description)}` : ''),
      instruction: text(pick.instruction) || null,
      area: areas.join(', '),
      polygons,
      issuedAt: text(alert.sent),
      validFrom: text(pick.effective) || text(pick.onset) || text(alert.sent),
      validTo: text(pick.expires),
      issuer: text(pick.senderName) || text(alert.sender),
      severity: text(pick.severity),
      urgency: text(pick.urgency),
      certainty: text(pick.certainty),
      lang: text(pick.language),
    },
  ];
}

/** Point-in-polygon for CAP "lat,lon lat,lon ..." polygons. Pure. */
export function inCapPolygon(point, polygon) {
  const pts = polygon
    .split(/\s+/)
    .map((p) => p.split(',').map(Number))
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [yi, xi] = pts[i];
    const [yj, xj] = pts[j];
    if (yi > point.lat !== yj > point.lat && point.lon < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const clean = (s) => String(s || '').toLowerCase();

/**
 * How a CAP warning relates to a place (PRD 7.1: "your places first, then
 * nearby districts, then state"):
 *   'place'  polygon contains the point, the area names the place's
 *            district, or the alert covers the whole state;
 *   'state'  same state, but a different district (Alerts page only);
 *   null     not relevant.
 * Only 'place' warnings reach the homepage cards and the alert ribbon, so a
 * flood warning for another district never appears as the user's own.
 */
export function capScope(w, place, author = '') {
  if (w.polygons?.length && Number.isFinite(place.lat)) {
    if (w.polygons.some((p) => inCapPolygon(place, p))) return 'place';
  }
  const area = clean(w.area);
  const state = clean(place.state);
  if (place.district && area.includes(clean(place.district))) return 'place';
  if (state && area.replace(/[.,]/g, '').trim() === state) return 'place';
  const hay = `${area} ${clean(w.issuer)} ${clean(author)}`;
  if (state && (hay.includes(state) || hay.includes(state.replace(/\s+/g, '-')))) return 'state';
  return null;
}

/** Back-compatible boolean: applies to this place. */
export function capMatchesPlace(w, place, author = '') {
  return capScope(w, place, author) === 'place';
}

export function sachetFeeds() {
  return (process.env.SACHET_FEED_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Active SACHET warnings for a place. Reads the most recent `limit` items of
 * each feed and their CAP documents (cached 5 minutes by the data cache).
 */
export async function fetchSachetWarnings(place, { lang = 'en', now = Date.now(), limit = 40 } = {}) {
  const feeds = sachetFeeds();
  if (!feeds.length) return { ok: false, reason: 'disabled' };
  const rss = await Promise.all(feeds.map((u) => fetchUpstream(u, { provider: 'sachet', as: 'text', revalidate: 300 })));
  if (rss.every((r) => !r.ok)) return { ok: false, reason: rss[0].reason };
  const items = rss.filter((r) => r.ok).flatMap((r) => parseRss(r.data)).slice(0, limit);
  const caps = await Promise.all(
    items.map((i) => fetchUpstream(i.link, { provider: 'sachet', as: 'text', revalidate: 300 }).then((r) => ({ r, i }))),
  );
  const out = [];
  const seen = new Set();
  for (const { r, i } of caps) {
    if (!r.ok) continue;
    for (const w of parseCap(r.data, { lang })) {
      if (seen.has(w.id)) continue;
      seen.add(w.id);
      if (w.validTo && Date.parse(w.validTo) <= now) continue;
      const scope = capScope(w, place, i.author);
      if (scope) out.push({ ...w, scope });
    }
  }
  return { ok: true, data: out, partial: rss.some((r) => !r.ok) };
}
