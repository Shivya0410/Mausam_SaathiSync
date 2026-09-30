/**
 * A deliberately small request-body validator.
 *
 * The brief requires bounded, validated input at the boundary. It also warns
 * against adding dependencies that are not pulling their weight. The shapes
 * here are half a dozen flat objects, so an explicit validator is easier to
 * audit than a schema library and keeps the lockfile still.
 *
 * If the surface grows past simple flat objects, replace this with zod rather
 * than extending it. That is the upgrade path, not a suggestion to keep
 * adding combinators here.
 */

import { ApiError } from './errors.js';

export const field = {
  string({ min = 0, max = 500, required = false, oneOf = null } = {}) {
    return (value) => {
      if (value === undefined || value === null) {
        return required ? 'is required' : null;
      }
      if (typeof value !== 'string') return 'must be a string';
      if (value.length < min) return `must be at least ${min} characters`;
      if (value.length > max) return `must be at most ${max} characters`;
      if (oneOf && !oneOf.includes(value)) return `must be one of: ${oneOf.join(', ')}`;
      return null;
    };
  },

  integer({ min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, required = false } = {}) {
    return (value) => {
      if (value === undefined || value === null) {
        return required ? 'is required' : null;
      }
      if (typeof value !== 'number' || !Number.isInteger(value)) return 'must be an integer';
      if (value < min) return `must be at least ${min}`;
      if (value > max) return `must be at most ${max}`;
      return null;
    };
  },

  boolean({ required = false } = {}) {
    return (value) => {
      if (value === undefined || value === null) {
        return required ? 'is required' : null;
      }
      if (typeof value !== 'boolean') return 'must be a boolean';
      return null;
    };
  },

  /** ISO calendar date, YYYY-MM-DD. Rejects impossible dates such as 2026-02-31. */
  isoDate({ required = false } = {}) {
    return (value) => {
      if (value === undefined || value === null) {
        return required ? 'is required' : null;
      }
      if (typeof value !== 'string') return 'must be a string';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'must be a date in YYYY-MM-DD format';
      const parsed = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(parsed.getTime())) return 'must be a real calendar date';
      if (parsed.toISOString().slice(0, 10) !== value) return 'must be a real calendar date';
      return null;
    };
  },
};

/**
 * Validate `body` against a flat map of field name to validator.
 *
 * Unknown keys are rejected rather than ignored. Silently dropping an
 * unrecognised field is how a typo in a client becomes a bug nobody can find,
 * and how a caller comes to believe it set something it did not.
 *
 * Throws ApiError(422) listing every offending field at once, so a client does
 * not have to fix errors one round trip at a time.
 */
export function validateBody(body, schema) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw ApiError.validationFailed({ _body: 'must be a JSON object' });
  }

  const fieldErrors = {};

  for (const [name, check] of Object.entries(schema)) {
    const message = check(body[name]);
    if (message) fieldErrors[name] = message;
  }

  for (const name of Object.keys(body)) {
    if (!(name in schema)) fieldErrors[name] = 'is not a recognised field';
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw ApiError.validationFailed(fieldErrors);
  }

  // Return only the known keys, so a caller cannot smuggle extra properties
  // into a repository write even if this function is later relaxed.
  const clean = {};
  for (const name of Object.keys(schema)) {
    if (body[name] !== undefined) clean[name] = body[name];
  }
  return clean;
}

/** Parse a JSON body, converting malformed JSON into a 422 rather than a 500. */
export async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw ApiError.validationFailed({ _body: 'must be valid JSON' });
  }
}
