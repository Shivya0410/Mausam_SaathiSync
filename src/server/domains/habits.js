/**
 * Habit logging and the sustain summary.
 *
 * Two rules from section 7.7 drive the shape of this module.
 *
 * First, the log is append-only and the summary is derived from it. There is
 * no stored total anywhere, so there is no field a client could write to award
 * itself points, and no way for a total to disagree with the events behind it.
 *
 * Second, every write is idempotent. A double-click, a retry after a timeout
 * or a flaky connection must not mint a second entry. Callers supply an
 * Idempotency-Key; replaying it with the same body returns the original
 * result, and reusing it with a different body is a conflict.
 */

import { createHash } from 'node:crypto';
import { ApiError } from '../http/errors.js';
import { field, validateBody } from '../http/validate.js';
import { getRepositories } from '../repositories/index.js';

export const HABIT_KINDS = ['water', 'steps', 'movement', 'mindfulness'];

const UNITS_BY_KIND = {
  water: 'ml',
  steps: 'steps',
  movement: 'minutes',
  mindfulness: 'minutes',
};

const habitSchema = {
  kind: field.string({ oneOf: HABIT_KINDS, required: true }),
  quantity: field.integer({ min: 1, max: 100000, required: true }),
  localDate: field.isoDate({ required: true }),
};

function hashBody(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/**
 * @param {string} ownerId       verified subject
 * @param {object} body          request body
 * @param {string|null} idempotencyKey  from the Idempotency-Key header
 */
export async function logHabit(ownerId, body, idempotencyKey) {
  if (!idempotencyKey || idempotencyKey.trim().length === 0) {
    throw ApiError.validationFailed({
      'Idempotency-Key': 'header is required so retries cannot double-count',
    });
  }

  const input = validateBody(body, habitSchema);
  const repositories = getRepositories();

  // Hash the validated input rather than the raw body, so a retry that differs
  // only in key order or an ignored field is still treated as the same write.
  const bodyHash = hashBody(input);

  const previous = await repositories.idempotency.find(ownerId, idempotencyKey);
  if (previous) {
    if (previous.bodyHash !== bodyHash) {
      throw ApiError.conflict(
        'This idempotency key was already used with a different request body.'
      );
    }
    return { record: previous.result, replayed: true };
  }

  const created = await repositories.habits.append(ownerId, {
    ...input,
    unit: UNITS_BY_KIND[input.kind],
    // The only provenance we can claim honestly. Section 7.1 requires steps to
    // carry a source, and nothing here is imported from a device.
    source: 'manual',
  });

  const { ownerId: _owner, ...presented } = created;
  await repositories.idempotency.record(ownerId, idempotencyKey, bodyHash, presented);

  return { record: presented, replayed: false };
}

/**
 * Derived view of the habit log. Never reads a stored total.
 *
 * Deliberately reports logged actions only. Section 7.7 requires an activity
 * unit, a baseline, a source emission factor and its version before anything
 * may be presented as a carbon saving, and none of those exist, so no such
 * figure is produced here.
 */
export async function getSustainSummary(ownerId) {
  const repositories = getRepositories();
  const entries = await repositories.habits.listAll(ownerId);

  const totalsByKind = Object.fromEntries(HABIT_KINDS.map((kind) => [kind, 0]));
  const activeDates = new Set();

  for (const entry of entries) {
    totalsByKind[entry.kind] = (totalsByKind[entry.kind] ?? 0) + entry.quantity;
    activeDates.add(entry.localDate);
  }

  return {
    entryCount: entries.length,
    activeDayCount: activeDates.size,
    totalsByKind,
    units: UNITS_BY_KIND,
    carbonEstimate: null,
    carbonEstimateNote:
      'No carbon figure is shown. Claiming one requires a source emission factor and a stated baseline, which this app does not have.',
  };
}
