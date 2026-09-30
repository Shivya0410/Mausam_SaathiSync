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

    describe() {
      return { name: 'in-memory', durable: false };
    },
  };
}
