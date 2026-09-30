import { cachedPublicRoute } from '../../../../server/http/handler.js';
import { parseQuery, q } from '../../../../server/http/query.js';
import { officialWarningsFor } from '../../../../lib/providers/snapshot.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mausam/warnings?lat&lon[&district][&state][&lang]
 * Official warnings only. warningsStatus 'unavailable' means no official
 * source answered; the UI must then say "Couldn't check", not "No warnings".
 */
export const GET = cachedPublicRoute(
  async ({ request }) => {
    const p = parseQuery(new URL(request.url).searchParams, {
      lat: q.number({ min: -90, max: 90, required: true, decimals: 2 }),
      lon: q.number({ min: -180, max: 180, required: true, decimals: 2 }),
      district: q.string({ max: 80 }),
      state: q.string({ max: 80 }),
      lang: q.string({ oneOf: ['en', 'hi'], fallback: 'en' }),
    });
    const { warnings, regionalWarnings, warningsStatus, checkedAt } = await officialWarningsFor(p);
    return { body: { warnings, regionalWarnings, warningsStatus, checkedAt } };
  },
  { sMaxAge: 120, staleWhileRevalidate: 180 },
);
