import { cachedPublicRoute } from '../../../../server/http/handler.js';
import { parseQuery, q } from '../../../../server/http/query.js';
import { ApiError } from '../../../../server/http/errors.js';
import { fetchClimatology } from '../../../../lib/providers/openMeteo/archive.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mausam/climatology?lat&lon&month&day[&window=3][&years=10]
 * "Based on past years, not a forecast."
 */
export const GET = cachedPublicRoute(
  async ({ request }) => {
    const p = parseQuery(new URL(request.url).searchParams, {
      lat: q.number({ min: -90, max: 90, required: true, decimals: 2 }),
      lon: q.number({ min: -180, max: 180, required: true, decimals: 2 }),
      month: q.integer({ min: 1, max: 12, required: true }),
      day: q.integer({ min: 1, max: 31, required: true }),
      window: q.integer({ min: 0, max: 7, fallback: 3 }),
      years: q.integer({ min: 3, max: 20, fallback: 10 }),
    });
    const r = await fetchClimatology({ ...p, currentYear: new Date().getUTCFullYear() });
    if (!r.ok) {
      if (r.reason === 'invalid_date') throw ApiError.validationFailed({ day: 'is not a real calendar date' });
      throw ApiError.upstreamUnavailable();
    }
    return { body: r.data };
  },
  { sMaxAge: 86400, staleWhileRevalidate: 86400 },
);
