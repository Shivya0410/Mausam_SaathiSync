/**
 * The wrapper every /api/v1 route handler goes through.
 *
 * Centralising this is what makes the guarantees in the architecture brief
 * structural rather than a checklist each new endpoint has to remember:
 *
 *   - every response carries a request id
 *   - every thrown error becomes the same normalised shape
 *   - an authenticated route cannot run its body without a verified subject
 *   - no response is cached
 */

import { randomUUID } from 'node:crypto';
import { toErrorResponse } from './errors.js';
import { verifyIdentity } from '../auth/verifyIdentity.js';

const NO_STORE = {
  'Cache-Control': 'no-store, private',
};

function jsonResponse(body, status, requestId) {
  return Response.json(body, {
    status,
    headers: { ...NO_STORE, 'X-Request-Id': requestId },
  });
}

/**
 * Wrap a public handler. `fn` receives ({ request, requestId }).
 */
export function publicRoute(fn) {
  return async function handle(request, routeContext) {
    const requestId = randomUUID();
    try {
      const { body, status = 200 } = await fn({ request, requestId, routeContext });
      return jsonResponse(body, status, requestId);
    } catch (error) {
      const { status, body } = toErrorResponse(error, requestId);
      return jsonResponse(body, status, requestId);
    }
  };
}

/**
 * Wrap an authenticated handler. `fn` receives ({ request, requestId, owner }).
 *
 * `owner` is the verified subject returned by the identity backend. It is the
 * only source of identity available to a handler: nothing reads a user id from
 * the request body, the query string or a header other than Authorization.
 * That is what makes cross-owner access impossible to write by accident.
 */
export function authenticatedRoute(fn) {
  return async function handle(request, routeContext) {
    const requestId = randomUUID();
    try {
      const owner = await verifyIdentity(request);
      const { body, status = 200 } = await fn({ request, requestId, owner, routeContext });
      return jsonResponse(body, status, requestId);
    } catch (error) {
      const { status, body } = toErrorResponse(error, requestId);
      return jsonResponse(body, status, requestId);
    }
  };
}
