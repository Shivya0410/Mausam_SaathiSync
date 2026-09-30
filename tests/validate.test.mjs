import test from 'node:test';
import assert from 'node:assert/strict';

import { field, validateBody } from '../src/server/http/validate.js';
import { ErrorCode } from '../src/server/http/errors.js';

const schema = {
  locale: field.string({ oneOf: ['en', 'hi'] }),
  note: field.string({ max: 10 }),
  count: field.integer({ min: 1, max: 5 }),
  flag: field.boolean(),
  day: field.isoDate(),
  name: field.string({ required: true }),
};

function expectValidationError(body) {
  try {
    validateBody(body, schema);
    assert.fail('expected validation to throw');
  } catch (error) {
    assert.equal(error.code, ErrorCode.VALIDATION_FAILED);
    assert.equal(error.status, 422);
    return error.details.fields;
  }
}

test('accepts a well-formed body and strips nothing it knows about', () => {
  const clean = validateBody({ name: 'ok', locale: 'hi', count: 3 }, schema);
  assert.deepEqual(clean, { name: 'ok', locale: 'hi', count: 3 });
});

test('reports a missing required field', () => {
  const fields = expectValidationError({ locale: 'en' });
  assert.match(fields.name, /required/);
});

test('rejects a value outside the allowed set', () => {
  const fields = expectValidationError({ name: 'ok', locale: 'fr' });
  assert.match(fields.locale, /must be one of/);
});

test('rejects an unknown field rather than silently dropping it', () => {
  const fields = expectValidationError({ name: 'ok', isAdmin: true });
  assert.match(fields.isAdmin, /not a recognised field/);
});

test('enforces string bounds', () => {
  const fields = expectValidationError({ name: 'ok', note: 'far too long to fit' });
  assert.match(fields.note, /at most 10/);
});

test('enforces integer bounds and rejects non-integers', () => {
  assert.match(expectValidationError({ name: 'ok', count: 9 }).count, /at most 5/);
  assert.match(expectValidationError({ name: 'ok', count: 2.5 }).count, /must be an integer/);
});

test('rejects a non-boolean for a boolean field', () => {
  assert.match(expectValidationError({ name: 'ok', flag: 'yes' }).flag, /must be a boolean/);
});

test('rejects dates that look valid but do not exist', () => {
  assert.match(expectValidationError({ name: 'ok', day: '2026-02-31' }).day, /real calendar date/);
  assert.match(expectValidationError({ name: 'ok', day: '26-01-01' }).day, /YYYY-MM-DD/);
  // A real date must pass, so the check above is not just rejecting everything.
  assert.deepEqual(validateBody({ name: 'ok', day: '2026-02-28' }, schema).day, '2026-02-28');
});

test('reports every offending field at once', () => {
  const fields = expectValidationError({ locale: 'fr', count: 99 });
  assert.deepEqual(Object.keys(fields).sort(), ['count', 'locale', 'name']);
});

test('rejects a non-object body', () => {
  for (const body of [null, 'string', 42, ['a']]) {
    try {
      validateBody(body, schema);
      assert.fail('expected validation to throw');
    } catch (error) {
      assert.equal(error.code, ErrorCode.VALIDATION_FAILED);
    }
  }
});
