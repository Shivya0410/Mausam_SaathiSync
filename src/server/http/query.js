/**
 * Query-string validation for GET routes. Same principle as validate.js:
 * every problem is reported at once as a 422, and unknown parameters are
 * rejected rather than silently ignored.
 */

import { ApiError } from './errors.js';

/**
 * @param {URLSearchParams} params
 * @param {Object<string, (raw: string|null) => ({ value?: any, error?: string })>} schema
 * @returns {object} parsed values
 */
export function parseQuery(params, schema) {
  const errors = {};
  for (const key of params.keys()) {
    if (!Object.prototype.hasOwnProperty.call(schema, key)) errors[key] = 'is not a recognised parameter';
  }
  const out = {};
  for (const [key, parse] of Object.entries(schema)) {
    const { value, error } = parse(params.get(key));
    if (error) errors[key] = error;
    else if (value !== undefined) out[key] = value;
  }
  if (Object.keys(errors).length) throw ApiError.validationFailed(errors);
  return out;
}

export const q = {
  number({ min, max, required = false, decimals = null } = {}) {
    return (raw) => {
      if (raw === null || raw === '') return required ? { error: 'is required' } : {};
      const n = Number(raw);
      if (!Number.isFinite(n)) return { error: 'must be a number' };
      if (min != null && n < min) return { error: `must be at least ${min}` };
      if (max != null && n > max) return { error: `must be at most ${max}` };
      return { value: decimals == null ? n : Math.round(n * 10 ** decimals) / 10 ** decimals };
    };
  },
  integer({ min, max, required = false, fallback } = {}) {
    return (raw) => {
      if (raw === null || raw === '') return required ? { error: 'is required' } : { value: fallback };
      if (!/^-?\d+$/.test(raw)) return { error: 'must be an integer' };
      const n = Number(raw);
      if (min != null && n < min) return { error: `must be at least ${min}` };
      if (max != null && n > max) return { error: `must be at most ${max}` };
      return { value: n };
    };
  },
  string({ min = 0, max = 100, required = false, oneOf = null, fallback } = {}) {
    return (raw) => {
      if (raw === null || raw === '') return required ? { error: 'is required' } : { value: fallback };
      const s = raw.trim();
      if (s.length < min) return { error: `must be at least ${min} characters` };
      if (s.length > max) return { error: `must be at most ${max} characters` };
      if (oneOf && !oneOf.includes(s)) return { error: `must be one of: ${oneOf.join(', ')}` };
      return { value: s };
    };
  },
  list({ allowed, max = 10, fallback = [] } = {}) {
    return (raw) => {
      if (raw === null || raw === '') return { value: fallback };
      const items = raw.split(',').map((x) => x.trim()).filter(Boolean);
      if (items.length > max) return { error: `must have at most ${max} items` };
      const bad = allowed ? items.filter((x) => !allowed.includes(x)) : [];
      if (bad.length) return { error: `has unknown values: ${bad.join(', ')}` };
      return { value: [...new Set(items)] };
    };
  },
};
