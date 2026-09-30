# /api/v1 contract

Schema version `1.0.0`. Implemented against the architecture brief, sections 5, 9 and 10.

This file records what is actually backed by working code and what is not. The brief
requires implementing only endpoints backed by real behaviour and documenting deferred
ones explicitly, so nothing below is a stub that returns fake success.

## Conventions

Every response carries an `X-Request-Id` header, and every error body repeats it.

Errors share one shape:

```json
{ "error": { "code": "validation_failed", "message": "...", "details": { }, "requestId": "..." } }
```

| Code | Status | Meaning |
|---|---|---|
| `unauthenticated` | 401 | No bearer token, or the identity backend rejected it |
| `forbidden` | 403 | Authenticated but not permitted |
| `not_found` | 404 | Absent, or present but owned by someone else |
| `conflict` | 409 | Duplicate create, or an idempotency key reused with a different body |
| `validation_failed` | 422 | Body failed validation; `details.fields` names each offender |
| `rate_limited` | 429 | Reserved; no limiter is implemented yet |
| `upstream_unavailable` | 503 | The identity backend could not be reached |
| `internal_error` | 500 | Unexpected. The cause is logged with the request id, never returned |

No response is cached (`Cache-Control: no-store, private`).

## Authentication

Send the token the app already stores at login:

```
Authorization: Bearer <token>
```

The server does **not** decode this token. It calls the identity backend's
`GET /api/auth/user` with it and uses that response as the authenticated subject.
A user id, role or flag in a request body is never read as identity.

**Known limitation.** The browser still holds its token in `localStorage` and still
logs in directly against the legacy backend. That is unchanged deliberately. Moving to
httpOnly cookies with CSRF protection is the correct end state, and section 12.2 of the
brief requires verifying login before and after such a migration. That verification is
not currently possible: there are no test credentials, and `NEXT_PUBLIC_API_BASE_URL`
in local development points at a backend that is not running. The migration is deferred
until it can be verified rather than performed blind.

## Implemented

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/health` | Public. Reports schema version, persistence adapter and feature flags |
| GET | `/api/v1/me/preferences` | Returns defaults with `isDefault: true` before any write |
| PATCH | `/api/v1/me/preferences` | `locale`, `timezone`, `reducedMotion`, `largeText` only |
| POST | `/api/v1/check-ins` | 201 on create, 409 if one already exists for that local date |
| POST | `/api/v1/habits` | Requires `Idempotency-Key`. 201 on create, 200 on replay, 409 on key reuse with a different body |
| GET | `/api/v1/sustain/summary` | Derived from the habit log. Never reads a stored total |
| GET | `/api/v1/dashboard` | Composes the above. Takes `?localDate=YYYY-MM-DD` |

### Why `localDate` comes from the client

Only the browser knows the user's actual local day. A server in another timezone would
roll the date over at the wrong moment. The value is validated as a real calendar date
and scoped to the verified owner, so the worst a caller can do is write its own record
under a date of its choosing.

### Why no carbon figure

`GET /api/v1/sustain/summary` returns `carbonEstimate: null` on purpose. Section 7.7
requires an activity unit, a comparison baseline, a source emission factor and its
version before any carbon claim. None of those exist, so the endpoint reports logged
actions and says why the estimate is absent.

## Deferred, with the blocker

| Path | Blocker |
|---|---|
| `/api/v1/yoga/sessions*` | Python recommender checkpoint is not in this repository |
| `/api/v1/tutorials/:id` | No tutorial catalogue with provenance, licence or review status exists |
| `/api/v1/recipes*`, `/api/v1/festivals` | Recipes carry no ingredients, allergens or provenance; section 7.4 needs those before recommending |
| `/api/v1/providers`, `/api/v1/consultation-requests` | No provider directory, and no verified credentials to populate one |
| `/api/v1/women/entries*` | **Deliberately not built on the in-memory store.** Cycle data that silently vanishes on restart is worse than an honest absence. Needs durable storage plus the separate consent and access controls in section 7.6 |
| `/api/v1/articles`, `/api/v1/content/reports` | Needs the moderation states in section 7.8 |
| `/api/v1/me/export-requests`, `/api/v1/me/deletion-requests` | Meaningless without durable storage |

## Persistence

The only adapter is in-memory. Data is lost on restart, on redeploy, and independently
per serverless instance. `GET /api/v1/health` reports this as
`persistence.durable: false` so it is visible at runtime.

Replacing it means adding one module implementing the contract in
`src/server/repositories/types.js` and one branch in `src/server/repositories/index.js`.
No endpoint or domain service should need to change.

## Boundary rule

Nothing under `src/server/` may be imported by a file carrying `"use client"`. That is
what keeps identity verification, ownership checks and upstream credentials on the
server rather than shipped to the browser.
