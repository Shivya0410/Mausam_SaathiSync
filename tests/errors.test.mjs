import test from 'node:test';
import assert from 'node:assert/strict';

import { ApiError, ErrorCode, toErrorResponse } from '../src/server/http/errors.js';

test('maps each error code to the status the brief specifies', () => {
  const expected = [
    [ApiError.unauthenticated(), 401],
    [ApiError.forbidden(), 403],
    [ApiError.notFound(), 404],
    [ApiError.conflict('clash'), 409],
    [ApiError.validationFailed({ a: 'bad' }), 422],
    [new ApiError(ErrorCode.RATE_LIMITED, 'slow down'), 429],
    [ApiError.upstreamUnavailable(), 503],
  ];

  for (const [error, status] of expected) {
    assert.equal(error.status, status, `${error.code} should be ${status}`);
    assert.equal(toErrorResponse(error, 'req-1').status, status);
  }
});

test('every error response carries the request id', () => {
  const { body } = toErrorResponse(ApiError.notFound(), 'req-abc');
  assert.equal(body.error.requestId, 'req-abc');
  assert.equal(body.error.code, ErrorCode.NOT_FOUND);
});

test('validation details name the offending fields', () => {
  const { body } = toErrorResponse(ApiError.validationFailed({ locale: 'bad' }), 'req-2');
  assert.deepEqual(body.error.details.fields, { locale: 'bad' });
});

test('an unexpected error never leaks its message to the client', () => {
  const leaky = new Error('postgres://user:hunter2@db.internal:5432 refused');

  // Keep the test output clean while still exercising the logging path.
  const originalConsoleError = console.error;
  console.error = () => {};
  const { status, body } = toErrorResponse(leaky, 'req-3');
  console.error = originalConsoleError;

  assert.equal(status, 500);
  assert.equal(body.error.code, ErrorCode.INTERNAL);
  assert.doesNotMatch(JSON.stringify(body), /hunter2|postgres|db\.internal/);
  assert.equal(body.error.requestId, 'req-3');
});
