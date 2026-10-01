// Crowd reports and feedback (PRD 11.2, 13.3, 13.5): validation, grid
// snapping, rate limits, location jumps, verification, votes and export.

import test from 'node:test';
import assert from 'node:assert/strict';

import { createMemoryRepositories } from '../src/server/repositories/memory.js';
import {
  createReport, listReports, voteReport, aggregateReports, createFeedback, validateReport,
  snapToGrid, statusFromConfidence, hashClient, LIMITS, GRID,
} from '../src/server/domains/reports.js';
import { createLimiter } from '../src/server/http/rateLimit.js';

const NOW = Date.parse('2026-09-30T09:00:00Z');
const SALT = 'test-salt';
const MUMBAI = { lat: 19.1197, lon: 72.8468 };

function body(over = {}) {
  return {
    type: 'waterlogging',
    label: 'flooded_street',
    confidence: 0.92,
    severity: 2,
    lat: MUMBAI.lat,
    lon: MUMBAI.lon,
    accuracyM: 20,
    observedAt: new Date(NOW - 2 * 60 * 1000).toISOString(),
    clientId: 'device-aaaa-1111',
    modelVersion: 'jal-bharav-1',
    lang: 'en',
    ...over,
  };
}
const opts = (over = {}) => ({ now: NOW, salt: SALT, ...over });
const code = (e) => e.code;

test('coordinates snap to the ~500 m grid and confidence sets the tier', () => {
  const s = snapToGrid(19.1197);
  assert.ok(Math.abs(s - 19.1197) <= GRID / 2 + 1e-9);
  assert.ok(Math.abs(s / GRID - Math.round(s / GRID)) < 1e-3, 'lies on a grid line');
  assert.equal(statusFromConfidence(0.7), 'ai_verified');
  assert.equal(statusFromConfidence(0.69), 'unverified');
  assert.equal(statusFromConfidence(0.5), 'unverified');
  assert.equal(statusFromConfidence(0.49), null);
});

test('validateReport rejects unknown fields, low confidence, stale time and bad severity at once', () => {
  assert.throws(() => validateReport(body({ note: 'hi' }), NOW), (e) => code(e) === 'validation_failed' && 'note' in e.details.fields);
  assert.throws(() => validateReport(body({ confidence: 0.3 }), NOW), (e) => e.details.fields.confidence === 'is too low to submit');
  assert.throws(() => validateReport(body({ observedAt: new Date(NOW - 45 * 60000).toISOString() }), NOW), (e) => 'observedAt' in e.details.fields);
  assert.throws(() => validateReport(body({ severity: 5 }), NOW), (e) => 'severity' in e.details.fields);
  assert.throws(() => validateReport(body({ severity: undefined }), NOW), (e) => 'severity' in e.details.fields);
  assert.throws(() => validateReport(body({ type: 'sky', label: 'Cb' }), NOW), (e) => 'severity' in e.details.fields, 'sky has no severity');
  assert.throws(() => validateReport(body({ label: 'free text here' }), NOW), (e) => 'label' in e.details.fields);
  const ok = validateReport(body({ type: 'sky', label: 'Cb', severity: undefined }), NOW);
  assert.equal(ok.status, 'ai_verified');
});

test('manual and Dhundh Meter reports carry no score and always start unverified', () => {
  const manual = validateReport(body({ confidence: undefined, modelVersion: 'manual' }), NOW);
  assert.equal(manual.status, 'unverified');
  const fog = validateReport(body({ type: 'fog', label: 'dense', severity: undefined, confidence: undefined, modelVersion: 'dhundh-dcp-0.1' }), NOW);
  assert.equal(fog.status, 'unverified');
  assert.equal(validateReport(body({ confidence: 0.99, modelVersion: 'manual' }), NOW).status, 'unverified', 'a manual pick is never AI-verified');
  assert.throws(() => validateReport(body({ confidence: undefined }), NOW), (e) => 'confidence' in e.details.fields);
});

test('a stored report is grid-snapped, expires by type and never exposes the device', async () => {
  const repos = createMemoryRepositories();
  const r = await createReport(repos, body(), opts());
  assert.equal(r.status, 'ai_verified');
  assert.equal(r.lat, snapToGrid(MUMBAI.lat));
  assert.equal(Date.parse(r.expiresAt) - Date.parse(r.observedAt), 3 * 3600 * 1000);
  assert.ok(!('clientHash' in r) && !('clientId' in r) && !('voters' in r));
  const sky = await createReport(repos, body({ type: 'sky', label: 'Cb', severity: undefined, clientId: 'device-bbbb-2222' }), opts());
  assert.equal(Date.parse(sky.expiresAt) - Date.parse(sky.observedAt), 3600 * 1000);
  const list = await listReports(repos, { ...MUMBAI, radiusKm: 2, now: NOW });
  assert.equal(list.length, 2);
  assert.ok(list.every((x) => !('clientHash' in x) && Number.isFinite(x.distanceKm)));
});

test('rate limit: 5 reports per device per hour', async () => {
  const repos = createMemoryRepositories();
  for (let i = 0; i < LIMITS.perHour; i++) {
    await createReport(repos, body({ lat: MUMBAI.lat + i * 0.01 }), opts({ now: NOW + i * 1000 }));
  }
  await assert.rejects(createReport(repos, body(), opts({ now: NOW + 10000 })), (e) => code(e) === 'rate_limited');
  // Another device is unaffected.
  await createReport(repos, body({ clientId: 'device-other-999' }), opts({ now: NOW + 10000 }));
});

test('location jumps over 50 km within 10 minutes are rejected', async () => {
  const repos = createMemoryRepositories();
  await createReport(repos, body(), opts());
  await assert.rejects(
    createReport(repos, body({ lat: 18.52, lon: 73.85 }), opts({ now: NOW + 5 * 60000 })),
    (e) => code(e) === 'validation_failed' && 'lat' in e.details.fields,
  );
});

test('two devices reporting the same street within the hour makes both community verified', async () => {
  const repos = createMemoryRepositories();
  const a = await createReport(repos, body({ confidence: 0.6 }), opts());
  assert.equal(a.status, 'unverified');
  const b = await createReport(repos, body({ clientId: 'device-bbbb-2222', lat: MUMBAI.lat + 0.001 }), opts({ now: NOW + 60000 }));
  assert.equal(b.status, 'community_verified');
  assert.equal((await repos.reports.get(a.id)).status, 'community_verified');
});

test('votes: one per device, two "still" verify, two "cleared" hide, no voting on your own', async () => {
  const repos = createMemoryRepositories();
  const r = await createReport(repos, body({ confidence: 0.55 }), opts());
  await assert.rejects(voteReport(repos, r.id, { vote: 'still', clientId: 'device-aaaa-1111' }, opts()), (e) => code(e) === 'conflict');
  const v1 = await voteReport(repos, r.id, { vote: 'still', clientId: 'device-v1-00001' }, opts());
  assert.equal(v1.confirmations, 1);
  assert.equal(v1.status, 'unverified');
  await assert.rejects(voteReport(repos, r.id, { vote: 'still', clientId: 'device-v1-00001' }, opts()), (e) => code(e) === 'conflict');
  const v2 = await voteReport(repos, r.id, { vote: 'still', clientId: 'device-v2-00002' }, opts());
  assert.equal(v2.status, 'community_verified');

  const other = await createReport(repos, body({ clientId: 'device-cccc-3333', lat: 19.2, type: 'fog', label: 'dense', severity: undefined }), opts());
  await voteReport(repos, other.id, { vote: 'cleared', clientId: 'device-x1-00001' }, opts());
  const gone = await voteReport(repos, other.id, { vote: 'cleared', clientId: 'device-x2-00002' }, opts());
  assert.equal(gone.status, 'cleared');
  const list = await listReports(repos, { lat: 19.2, lon: MUMBAI.lon, radiusKm: 1, now: NOW });
  assert.ok(!list.some((x) => x.id === other.id), 'cleared reports are hidden');
  await assert.rejects(voteReport(repos, other.id, { vote: 'still', clientId: 'device-x3-00003' }, opts()), (e) => code(e) === 'not_found');
  await assert.rejects(voteReport(repos, r.id, { vote: 'maybe', clientId: 'device-x3-00003' }, opts()), (e) => code(e) === 'validation_failed');
});

test('expired reports drop out of the list', async () => {
  const repos = createMemoryRepositories();
  await createReport(repos, body(), opts());
  assert.equal((await listReports(repos, { ...MUMBAI, now: NOW + 3.5 * 3600 * 1000 })).length, 0);
});

test('export aggregates by grid cell with no ids, hashes or exact times', async () => {
  const repos = createMemoryRepositories();
  await createReport(repos, body(), opts());
  await createReport(repos, body({ clientId: 'device-bbbb-2222', severity: 4 }), opts({ now: NOW + 1000 }));
  const geo = aggregateReports(await repos.reports.listSince(NOW - 3600e3), { since: NOW - 3600e3 });
  assert.equal(geo.type, 'FeatureCollection');
  assert.equal(geo.features.length, 1);
  const p = geo.features[0].properties;
  assert.equal(p.count, 2);
  assert.equal(p.maxSeverity, 4);
  const text = JSON.stringify(geo);
  assert.ok(!/rpt_|clientHash|device-/.test(text));
});

test('client hashes are salted and stable', () => {
  assert.equal(hashClient('abc', 's1'), hashClient('abc', 's1'));
  assert.notEqual(hashClient('abc', 's1'), hashClient('abc', 's2'));
  assert.equal(hashClient('abc', 's1').length, 32);
});

test('feedback: card needs a rule, site needs a message, capped at 1,000 chars', async () => {
  const repos = createMemoryRepositories();
  const ok = await createFeedback(repos, { kind: 'card', ruleId: 'general.umbrella', helpful: false, lang: 'hi', page: '/' });
  assert.ok(ok.id);
  await assert.rejects(createFeedback(repos, { kind: 'card' }), (e) => 'ruleId' in e.details.fields);
  await assert.rejects(createFeedback(repos, { kind: 'site', message: '  ' }), (e) => 'message' in e.details.fields);
  await assert.rejects(createFeedback(repos, { kind: 'site', message: 'x'.repeat(1001) }), (e) => 'message' in e.details.fields);
  await assert.rejects(createFeedback(repos, { kind: 'site', message: 'ok', email: 'not-an-email', consent: true }), (e) => 'email' in e.details.fields);
  await assert.rejects(createFeedback(repos, { kind: 'site', message: 'ok', email: 'me@example.in' }), (e) => 'consent' in e.details.fields, 'email needs consent');
  await assert.rejects(createFeedback(repos, { kind: 'site', message: 'ok', name: 'X' }), (e) => 'name' in e.details.fields);
  await createFeedback(repos, { kind: 'site', category: 'bug', message: 'Map is slow', email: 'Me@Example.in', consent: true, lang: 'en', page: '/map' });
  const list = await repos.feedback.list();
  assert.equal(list.length, 2);
  assert.equal(list[1].email, 'me@example.in');
  assert.ok(list[1].consentAt);
  assert.equal(list[0].email, null);
});

test('IP limiter blocks after the limit and recovers after the window', () => {
  const check = createLimiter({ limit: 2, windowMs: 1000 });
  check('ip', 0);
  check('ip', 10);
  assert.throws(() => check('ip', 20), (e) => e.code === 'rate_limited' && e.details.retryAfterS === 1);
  check('ip', 1500);
  check('other', 20);
});
