/**
 * Daily check-in.
 *
 * Section 7.1 asks for a short daily check-in rather than re-running a full
 * profile on every visit. One per owner per local date.
 *
 * The date is supplied by the client because only the browser knows the user's
 * actual local day, and a server in another timezone would roll over at the
 * wrong moment. It is validated as a real calendar date and scoped to the
 * verified owner, so the worst a caller can do is write its own record under a
 * date of its choosing.
 */

import { ApiError } from '../http/errors.js';
import { field, validateBody } from '../http/validate.js';
import { getRepositories } from '../repositories/index.js';

export const ENERGY_LEVELS = ['low', 'medium', 'high'];

const checkInSchema = {
  localDate: field.isoDate({ required: true }),
  energy: field.string({ oneOf: ENERGY_LEVELS, required: true }),
  note: field.string({ max: 280 }),
};

export async function createCheckIn(ownerId, body) {
  const input = validateBody(body, checkInSchema);
  const repositories = getRepositories();

  const existing = await repositories.checkIns.findByDate(ownerId, input.localDate);
  if (existing) {
    // A repeat is a conflict rather than a silent overwrite: the caller asked
    // to create something that already exists, and quietly replacing the
    // earlier answer would lose data the user entered.
    throw ApiError.conflict('A check-in already exists for this date.', {
      localDate: input.localDate,
    });
  }

  const created = await repositories.checkIns.create(ownerId, input);
  const { ownerId: _owner, ...presented } = created;
  return presented;
}

export async function findCheckIn(ownerId, localDate) {
  const repositories = getRepositories();
  const record = await repositories.checkIns.findByDate(ownerId, localDate);
  if (!record) return null;
  const { ownerId: _owner, ...presented } = record;
  return presented;
}
