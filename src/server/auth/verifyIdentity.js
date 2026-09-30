/**
 * Server-side identity verification.
 *
 * This is the trust boundary described in section 5.4 of the architecture
 * brief. The important property is negative: this module never decodes the
 * token, never reads a user id from a request body, and never believes a role
 * or flag sent by the browser. Identity is whatever the legacy authentication
 * backend says it is when handed the caller's token, and nothing else.
 *
 * Compatibility note. The browser still holds its token in localStorage and
 * still logs in directly against the legacy backend; none of that changed.
 * What changed is that the server now verifies that token rather than assuming
 * a request carrying one is trustworthy. Moving to httpOnly cookies with CSRF
 * protection is the correct end state and is deliberately deferred, because
 * migrating token handling requires verifying login before and after, which
 * needs credentials and a reachable backend. See contracts/api-v1.md.
 */

import { ApiError } from '../http/errors.js';

/**
 * Server-only. Falls back to the public variable so an existing deployment
 * that has not set the server-only one keeps working.
 */
function authBaseUrl() {
  return (
    process.env.LEGACY_AUTH_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://sih24-backend.onrender.com'
  );
}

/** Upstream is on a free tier that sleeps, but a request must not hang. */
const VERIFY_TIMEOUT_MS = 8000;

function bearerToken(request) {
  const header = request.headers.get('authorization');
  if (!header) return null;

  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (!/^Bearer$/i.test(scheme)) return null;

  const token = rest.join(' ').trim();
  return token.length > 0 ? token : null;
}

/**
 * Resolve the authenticated owner for a request.
 *
 * @returns {Promise<{ id: string, email?: string, raw: object }>}
 * @throws  ApiError 401 when there is no usable token or upstream rejects it
 * @throws  ApiError 503 when upstream cannot be reached
 */
export async function verifyIdentity(request) {
  const token = bearerToken(request);
  if (!token) {
    throw ApiError.unauthenticated('A bearer token is required.');
  }

  let response;
  try {
    response = await fetch(`${authBaseUrl()}/api/auth/user`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch (error) {
    // A timeout or DNS failure is our problem, not the caller's. Reporting it
    // as 401 would tell them to log in again, which would not help.
    console.error('Identity verification could not reach the auth backend:', error?.name);
    throw ApiError.upstreamUnavailable('Could not verify your session. Please try again.');
  }

  if (response.status === 401 || response.status === 403) {
    throw ApiError.unauthenticated('Your session is not valid. Please sign in again.');
  }

  if (!response.ok) {
    throw ApiError.upstreamUnavailable('Could not verify your session. Please try again.');
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw ApiError.upstreamUnavailable('Could not verify your session. Please try again.');
  }

  const user = payload?.userData;
  const id = user?._id || user?.id;

  // A 200 without a usable subject is not an authenticated request. Falling
  // back to something like the email here would invent an identity.
  if (!id) {
    console.error('Auth backend returned 200 with no identifiable subject.');
    throw ApiError.unauthenticated('Your session is not valid. Please sign in again.');
  }

  return { id: String(id), email: user.email, raw: user };
}
