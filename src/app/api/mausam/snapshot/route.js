import { cachedPublicRoute } from '../../../../server/http/handler.js';
import { parseQuery, q } from '../../../../server/http/query.js';
import { ApiError } from '../../../../server/http/errors.js';
import { buildSnapshot } from '../../../../lib/providers/snapshot.js';
import { SCENARIO_IDS } from '../../../../data/fixtures/scenarios.js';

// Caching is done with Cache-Control and the fetch data cache, per request.
export const dynamic = 'force-dynamic';

/**
 * GET /api/mausam/snapshot?lat&lon[&include][&lang][&name][&district][&state][&demo]
 * Coordinates are rounded to 2 decimals (about 1.1 km) before use, so exact
 * locations never reach upstream providers (PRD 12.4, 15.5).
 */
export const GET = cachedPublicRoute(
  async ({ request }) => {
    const p = parseQuery(new URL(request.url).searchParams, {
      lat: q.number({ min: -90, max: 90, required: true, decimals: 2 }),
      lon: q.number({ min: -180, max: 180, required: true, decimals: 2 }),
      include: q.list({ allowed: ['air', 'marine', 'warnings', 'sun', 'soil'], fallback: ['air', 'warnings', 'sun'] }),
      lang: q.string({ oneOf: ['en', 'hi'], fallback: 'en' }),
      name: q.string({ max: 80 }),
      district: q.string({ max: 80 }),
      state: q.string({ max: 80 }),
      demo: q.string({ oneOf: SCENARIO_IDS }),
    });
    const snapshot = await buildSnapshot(p);
    if (!snapshot) throw ApiError.upstreamUnavailable();
    return { body: snapshot };
  },
  { sMaxAge: 300, staleWhileRevalidate: 600 },
);
