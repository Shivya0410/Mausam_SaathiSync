/**
 * In-memory repository implementation.
 *
 * NOT A PRODUCTION STORE. Everything here lives in process memory and is lost
 * on restart, on redeploy, and independently per serverless instance. It
 * exists so the /api/v1 boundary can be exercised end to end while the choice
 * of database is still unauthorised.
 *
 * This is reported at runtime by GET /api/v1/health as a non-durable adapter,
 * so nobody has to read this comment to discover it.
 *
 * Replacing it means adding one sibling file implementing the same contract
 * and changing the factory in ./index.js. No endpoint or domain service
 * should need to change.
 */

/** @typedef {import('./types.js').Repositories} Repositories */

import { haversineKm } from '../../lib/mausam/geo.js';

// Bounds so an unauthenticated public endpoint cannot grow memory forever.
const MAX_REPORTS = 5000;
const MAX_FEEDBACK = 2000;

const DEFAULT_PREFERENCES = {
  locale: 'en',
  timezone: 'Asia/Kolkata',
  reducedMotion: false,
  largeText: false,
};

export function createMemoryRepositories() {
  /** @type {Map<string, object>} */
  const preferences = new Map();
  /** @type {Map<string, object>} ownerId + '|' + localDate */
  const checkIns = new Map();
  /** @type {Map<string, object[]>} ownerId -> append-only list */
  const habits = new Map();
  /** @type {Map<string, object>} ownerId + '|' + key */
  const idempotency = new Map();

  let habitSequence = 0;

  /** @type {Map<string, object>} id -> CrowdReport (with clientHash and voters) */
  const reports = new Map();
  /** @type {object[]} */
  const feedback = [];
  /** @type {Map<string, object>} endpoint -> PushSubscription */
  const push = new Map();
  /** @type {Map<string, object>} key -> WarningState */
  const warningState = new Map();
  let reportSequence = 0;
  let feedbackSequence = 0;

  const active = (r, now) => r.status !== 'cleared' && Date.parse(r.expiresAt) > now;
  const copy = (r) => (r ? { ...r, voters: { ...r.voters } } : null);

  function pruneReports(now) {
    for (const [id, r] of reports) if (Date.parse(r.expiresAt) <= now - 24 * 3600 * 1000) reports.delete(id);
    while (reports.size >= MAX_REPORTS) reports.delete(reports.keys().next().value);
  }

  const scoped = (ownerId, key) => `${ownerId}|${key}`;

  return {
    preferences: {
      async get(ownerId) {
        return preferences.get(ownerId) ?? null;
      },

      async upsert(ownerId, patch) {
        const existing = preferences.get(ownerId);
        const next = {
          ...DEFAULT_PREFERENCES,
          ...(existing ?? {}),
          ...patch,
          ownerId,
          version: (existing?.version ?? 0) + 1,
          updatedAt: new Date().toISOString(),
        };
        preferences.set(ownerId, next);
        return next;
      },
    },

    checkIns: {
      async findByDate(ownerId, localDate) {
        return checkIns.get(scoped(ownerId, localDate)) ?? null;
      },

      async create(ownerId, checkIn) {
        const record = {
          ...checkIn,
          ownerId,
          createdAt: new Date().toISOString(),
        };
        checkIns.set(scoped(ownerId, checkIn.localDate), record);
        return record;
      },
    },

    habits: {
      async append(ownerId, habit) {
        habitSequence += 1;
        const record = {
          ...habit,
          id: `habit_${habitSequence}`,
          ownerId,
          createdAt: new Date().toISOString(),
        };
        const list = habits.get(ownerId) ?? [];
        list.push(record);
        habits.set(ownerId, list);
        return record;
      },

      async listAll(ownerId) {
        // Copy so a caller cannot mutate the stored log by accident. The real
        // store would return fresh rows anyway; matching that here keeps the
        // adapters behaviourally interchangeable.
        return [...(habits.get(ownerId) ?? [])];
      },
    },

    idempotency: {
      async find(ownerId, key) {
        return idempotency.get(scoped(ownerId, key)) ?? null;
      },

      async record(ownerId, key, bodyHash, result) {
        idempotency.set(scoped(ownerId, key), {
          ownerId,
          key,
          bodyHash,
          result,
          createdAt: new Date().toISOString(),
        });
      },
    },

    // Crowd reports are anonymous and public: NOT owner-scoped (see types.js).
    reports: {
      async create(report) {
        const refTime = Date.parse(report.observedAt) || Date.now();
        pruneReports(refTime);
        reportSequence += 1;
        const record = { ...report, id: `rpt_${Date.now().toString(36)}${reportSequence.toString(36)}`, voters: {} };
        reports.set(record.id, record);
        return copy(record);
      },

      async get(id) {
        return copy(reports.get(id));
      },

      async update(id, patch) {
        const r = reports.get(id);
        if (!r) return null;
        Object.assign(r, patch);
        return copy(r);
      },

      async listNear(lat, lon, radiusKm, types, now = Date.now()) {
        const out = [];
        for (const r of reports.values()) {
          if (!active(r, now) || !types.includes(r.type)) continue;
          if (haversineKm({ lat, lon }, r) <= radiusKm) out.push(copy(r));
        }
        return out;
      },

      async listByClient(clientHash, sinceMs) {
        return [...reports.values()].filter((r) => r.clientHash === clientHash && Date.parse(r.createdAt) >= sinceMs).map(copy);
      },

      /** One vote per client; returns the updated report, or null if already voted. */
      async vote(id, clientHash, vote) {
        const r = reports.get(id);
        if (!r || r.voters[clientHash]) return null;
        r.voters[clientHash] = vote;
        if (vote === 'still') r.confirmations += 1;
        else r.clears += 1;
        return copy(r);
      },

      async listSince(sinceMs) {
        return [...reports.values()].filter((r) => Date.parse(r.observedAt) >= sinceMs).map(copy);
      },
    },

    feedback: {
      async create(item) {
        feedbackSequence += 1;
        const record = { ...item, id: `fb_${feedbackSequence}` };
        feedback.push(record);
        if (feedback.length > MAX_FEEDBACK) feedback.shift();
        return { ...record };
      },

      async list() {
        return feedback.map((f) => ({ ...f }));
      },
    },

    push: {
      async upsert(sub) {
        const record = { ...sub, updatedAt: new Date().toISOString() };
        push.set(sub.endpoint, record);
        return { ...record };
      },

      async remove(endpoint) {
        return push.delete(endpoint);
      },

      async listByDistrict(districtId) {
        return [...push.values()].filter((p) => p.districtId === districtId).map((p) => ({ ...p }));
      },
    },

    warningState: {
      async get(key) {
        return warningState.has(key) ? { ...warningState.get(key) } : null;
      },

      async set(key, value) {
        warningState.set(key, { ...value, key, updatedAt: new Date().toISOString() });
      },
    },

    describe() {
      return { name: 'in-memory', durable: false };
    },
  };
}
