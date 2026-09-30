/**
 * User preferences: locale, timezone and accessibility settings.
 *
 * Section 7.8 of the brief scopes this to non-sensitive settings only. No
 * medical history, location, body measurements or cycle information belongs
 * here, and none of it is accepted by the schema below.
 */

import { field, validateBody } from '../http/validate.js';
import { getRepositories } from '../repositories/index.js';

export const LOCALES = ['en', 'hi'];

const preferencesSchema = {
  locale: field.string({ oneOf: LOCALES }),
  // Not validated against the IANA database: shipping a zone list for one
  // field is disproportionate. Bounded and type-checked, and a bad value
  // degrades to a formatting default rather than a failure.
  timezone: field.string({ min: 1, max: 64 }),
  reducedMotion: field.boolean(),
  largeText: field.boolean(),
};

const DEFAULTS = {
  locale: 'en',
  timezone: 'Asia/Kolkata',
  reducedMotion: false,
  largeText: false,
};

function present(record) {
  if (!record) {
    return { ...DEFAULTS, version: 0, updatedAt: null, isDefault: true };
  }
  const { ownerId, ...rest } = record;
  return { ...rest, isDefault: false };
}

export async function getPreferences(ownerId) {
  const repositories = getRepositories();
  return present(await repositories.preferences.get(ownerId));
}

export async function updatePreferences(ownerId, body) {
  const patch = validateBody(body, preferencesSchema);
  const repositories = getRepositories();
  return present(await repositories.preferences.upsert(ownerId, patch));
}
