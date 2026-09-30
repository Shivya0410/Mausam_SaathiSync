/**
 * Crowd reports (PRD sections 11.2, 13.3 and 27.13).
 *
 * Reports are anonymous and public, so unlike every other domain here they
 * are not owner-scoped. What keeps them safe:
 * - no free text and no photos are ever sent;
 * - coordinates are snapped to a ~500 m grid before storage;
 * - the device id is stored only as a salted hash, used for rate limits,
 *   location-jump checks and one-vote-per-report;
 * - the hash never leaves the server (publicReport strips it).
 */

import { createHash, randomBytes } from 'node:crypto';
import { ApiError } from '../http/errors.js';
import { validateBody, field } from '../http/validate.js';
import { haversineKm } from '../../lib/mausam/geo.js';

export const REPORT_TYPES = ['waterlogging', 'sky', 'fog'];
export const GRID = 0.0045;
export const LIMITS = Object.freeze({
  perHour: 5,
  perDay: 20,
  jumpKm: 50,
  jumpMinutes: 10,
  maxSkewMinutes: 30,
  communityKm: 0.5,
  communityMinutes: 60,
  aiVerified: 0.7,
  unverified: 0.5,
});
export const TTL_HOURS = Object.freeze({ waterlogging: 3, sky: 1, fog: 2 });

const MIN = 60 * 1000;
const HOUR = 60 * MIN;

// A fresh random salt per process when none is configured: hashes then
// cannot be linked across restarts, which is the privacy-preserving default.
const SALT = process.env.REPORTS_SALT || randomBytes(16).toString('hex');

export function hashClient(clientId, salt = SALT) {
  return createHash('sha256').update(`${salt}:${clientId}`).digest('hex').slice(0, 32);
}

/** Snap a coordinate to the ~500 m storage grid (4 decimals is plenty). */
export function snapToGrid(v) {
  return Math.round(Math.round(v / GRID) * GRID * 1e4) / 1e4;
}

/** Status from on-device model confidence; null means "cannot submit". */
export function statusFromConfidence(confidence) {
  if (confidence >= LIMITS.aiVerified) return 'ai_verified';
  if (confidence >= LIMITS.unverified) return 'unverified';
  return null;
}

const SCHEMA = {
  type: field.string({ required: true, oneOf: REPORT_TYPES }),
  label: field.string({ required: true, min: 1, max: 40 }),
  confidence: field.number({ required: true, min: 0, max: 1 }),
  severity: field.integer({ min: 1, max: 4 }),
  lat: field.number({ required: true, min: -90, max: 90 }),
  lon: field.number({ required: true, min: -180, max: 180 }),
  accuracyM: field.number({ min: 0, max: 100000 }),
  observedAt: field.string({ required: true, max: 40 }),
  clientId: field.string({ required: true, min: 8, max: 64 }),
  modelVersion: field.string({ required: true, max: 40 }),
  lang: field.string({ oneOf: ['en', 'hi'] }),
};

/**
 * Validate a report body. Throws the standard 422 with every bad field.
 * @returns {object} clean body with snapped coordinates and a status
 */
export function validateReport(body, now = Date.now()) {
  const clean = validateBody(body, SCHEMA);
  const errors = {};
  if (!/^[a-zA-Z0-9_-]+$/.test(clean.label)) errors.label = 'must be a short code';
  if (clean.type === 'waterlogging' && clean.severity == null) errors.severity = 'is required for waterlogging';
  if (clean.type !== 'waterlogging' && clean.severity != null) errors.severity = 'is only for waterlogging';
  const observed = Date.parse(clean.observedAt);
  if (!Number.isFinite(observed)) errors.observedAt = 'must be an ISO timestamp';
  else if (Math.abs(now - observed) > LIMITS.maxSkewMinutes * MIN) errors.observedAt = 'must be within 30 minutes of now';
  const status = statusFromConfidence(clean.confidence);
  if (!status && !errors.confidence) errors.confidence = 'is too low to submit';
  if (Object.keys(errors).length) throw ApiError.validationFailed(errors);
  return { ...clean, lat: snapToGrid(clean.lat), lon: snapToGrid(clean.lon), observedMs: observed, status };
}

/** The public shape: never includes the client hash. */
export function publicReport(r) {
  const { clientHash, voters, ...rest } = r;
  void clientHash;
  void voters;
  return rest;
}

/**
 * Create a report: validate, rate limit, reject location jumps, store, then
 * upgrade to community_verified when another device reported the same thing
 * nearby within the hour.
 */
export async function createReport(repos, body, { now = Date.now(), salt = SALT } = {}) {
  const v = validateReport(body, now);
  const clientHash = hashClient(v.clientId, salt);
  const mine = await repos.reports.listByClient(clientHash, now - 24 * HOUR);
  const lastHour = mine.filter((r) => Date.parse(r.createdAt) > now - HOUR);
  if (lastHour.length >= LIMITS.perHour || mine.length >= LIMITS.perDay) {
    throw ApiError.rateLimited('You have sent the most reports allowed for now. Thank you for helping.', {
      perHour: LIMITS.perHour,
      perDay: LIMITS.perDay,
    });
  }
  const recent = mine.filter((r) => Date.parse(r.createdAt) > now - LIMITS.jumpMinutes * MIN);
  if (recent.some((r) => haversineKm(r, v) > LIMITS.jumpKm)) {
    throw ApiError.validationFailed({ lat: 'is too far from your last report', lon: 'is too far from your last report' });
  }

  const observedAt = new Date(v.observedMs).toISOString();
  const record = await repos.reports.create({
    type: v.type,
    label: v.label,
    confidence: Math.round(v.confidence * 100) / 100,
    severity: v.severity ?? null,
    lat: v.lat,
    lon: v.lon,
    accuracyM: v.accuracyM ?? null,
    observedAt,
    expiresAt: new Date(v.observedMs + TTL_HOURS[v.type] * HOUR).toISOString(),
    modelVersion: v.modelVersion,
    lang: v.lang ?? 'en',
    status: v.status,
    confirmations: 0,
    clears: 0,
    clientHash,
    createdAt: new Date(now).toISOString(),
  });

  const nearby = await repos.reports.listNear(v.lat, v.lon, LIMITS.communityKm, [v.type], now);
  const others = nearby.filter(
    (r) => r.id !== record.id && r.clientHash !== clientHash && Math.abs(Date.parse(r.observedAt) - v.observedMs) <= LIMITS.communityMinutes * MIN,
  );
  if (others.length) {
    for (const r of others) if (r.status !== 'community_verified') await repos.reports.update(r.id, { status: 'community_verified' });
    return publicReport(await repos.reports.update(record.id, { status: 'community_verified' }));
  }
  return publicReport(record);
}

/** Active reports near a point (not expired, not cleared). */
export async function listReports(repos, { lat, lon, radiusKm = 5, types = REPORT_TYPES, now = Date.now() }) {
  const list = await repos.reports.listNear(lat, lon, Math.min(radiusKm, 25), types, now);
  return list
    .map((r) => ({ ...publicReport(r), distanceKm: Math.round(haversineKm({ lat, lon }, r) * 10) / 10 }))
    .sort((a, b) => a.distanceKm - b.distanceKm || Date.parse(b.observedAt) - Date.parse(a.observedAt));
}

/**
 * "Still there?" votes: one per device per report. Two "still" votes verify
 * a report; two "cleared" votes hide it.
 */
export async function voteReport(repos, id, body, { now = Date.now(), salt = SALT } = {}) {
  const v = validateBody(body, {
    vote: field.string({ required: true, oneOf: ['still', 'cleared'] }),
    clientId: field.string({ required: true, min: 8, max: 64 }),
  });
  const report = await repos.reports.get(id);
  if (!report || report.status === 'cleared' || Date.parse(report.expiresAt) <= now) throw ApiError.notFound('This report is no longer active.');
  const clientHash = hashClient(v.clientId, salt);
  if (report.clientHash === clientHash) throw ApiError.conflict('You cannot vote on your own report.');
  const updated = await repos.reports.vote(id, clientHash, v.vote);
  if (!updated) throw ApiError.conflict('You have already answered for this report.');
  let status = updated.status;
  if (updated.clears >= 2) status = 'cleared';
  else if (updated.confirmations >= 2) status = 'community_verified';
  const final = status === updated.status ? updated : await repos.reports.update(id, { status });
  return publicReport(final);
}

/**
 * Anonymised export for city disaster cells and IMD (PRD 11.2): one GeoJSON
 * feature per grid cell with count, max severity and time window. No ids,
 * no hashes, no individual timestamps.
 */
export function aggregateReports(reports, { since = 0 } = {}) {
  const cells = new Map();
  for (const r of reports) {
    const t = Date.parse(r.observedAt);
    if (!(t >= since) || r.status === 'cleared') continue;
    const key = `${r.type}|${r.lat}|${r.lon}`;
    const c = cells.get(key) || { type: r.type, lat: r.lat, lon: r.lon, count: 0, maxSeverity: null, from: t, to: t, verified: 0 };
    c.count += 1;
    if (r.severity != null) c.maxSeverity = Math.max(c.maxSeverity ?? 0, r.severity);
    c.from = Math.min(c.from, t);
    c.to = Math.max(c.to, t);
    if (r.status === 'ai_verified' || r.status === 'community_verified') c.verified += 1;
    cells.set(key, c);
  }
  return {
    type: 'FeatureCollection',
    features: [...cells.values()].map((c) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [c.lon, c.lat] },
      properties: {
        reportType: c.type,
        count: c.count,
        verified: c.verified,
        maxSeverity: c.maxSeverity,
        from: new Date(c.from).toISOString(),
        to: new Date(c.to).toISOString(),
        gridDeg: GRID,
      },
    })),
  };
}

/** Site and card feedback (PRD 13.3): no personal data, message capped. */
export async function createFeedback(repos, body, { now = Date.now() } = {}) {
  const v = validateBody(body, {
    kind: field.string({ required: true, oneOf: ['card', 'site'] }),
    ruleId: field.string({ max: 60 }),
    helpful: field.boolean(),
    message: field.string({ max: 1000 }),
    lang: field.string({ oneOf: ['en', 'hi'] }),
    page: field.string({ max: 120 }),
  });
  if (v.kind === 'card' && !v.ruleId) throw ApiError.validationFailed({ ruleId: 'is required for card feedback' });
  if (v.kind === 'site' && !v.message?.trim()) throw ApiError.validationFailed({ message: 'is required for site feedback' });
  if (v.page && !v.page.startsWith('/')) throw ApiError.validationFailed({ page: 'must be a path' });
  const item = await repos.feedback.create({ ...v, message: v.message?.trim() || null, createdAt: new Date(now).toISOString() });
  return { id: item.id, createdAt: item.createdAt };
}
