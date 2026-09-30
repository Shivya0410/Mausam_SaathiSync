import { cachedPublicRoute } from '../../../../../server/http/handler.js';
import { parseQuery, q } from '../../../../../server/http/query.js';
import { ApiError } from '../../../../../server/http/errors.js';
import { searchPlaces } from '../../../../../lib/providers/openMeteo/geocoding.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mausam/places/search?q[&lang]: India first. Numeric queries
 * (PIN codes) return no results with hint 'place_name', because the
 * geocoder does not resolve PINs.
 */
export const GET = cachedPublicRoute(
  async ({ request }) => {
    const p = parseQuery(new URL(request.url).searchParams, {
      q: q.string({ min: 2, max: 80, required: true }),
      lang: q.string({ oneOf: ['en', 'hi'], fallback: 'en' }),
    });
    const r = await searchPlaces(p.q, p.lang);
    if (!r.ok) throw ApiError.upstreamUnavailable();
    return { body: { results: r.data, source: r.source, ...(r.hint ? { hint: r.hint } : {}) } };
  },
  { sMaxAge: 86400, staleWhileRevalidate: 86400 },
);
