import { cachedPublicRoute } from '../../../../server/http/handler.js';
import { parseQuery, q } from '../../../../server/http/query.js';
import { ApiError } from '../../../../server/http/errors.js';
import { fetchAirports } from '../../../../lib/providers/aviation/metar.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/mausam/airport?icao=VIDP,VABB (max 4): decoded METAR and TAF.
 * Airport weather, not flight status.
 */
export const GET = cachedPublicRoute(
  async ({ request }) => {
    const p = parseQuery(new URL(request.url).searchParams, {
      icao: q.list({ max: 4 }),
    });
    const ids = (p.icao || []).map((x) => x.toUpperCase());
    if (!ids.length || ids.some((x) => !/^[A-Z]{4}$/.test(x))) {
      throw ApiError.validationFailed({ icao: 'must be 1 to 4 four-letter ICAO codes' });
    }
    const r = await fetchAirports(ids);
    if (!r.ok) throw ApiError.upstreamUnavailable();
    return { body: { airports: r.data } };
  },
  { sMaxAge: 300, staleWhileRevalidate: 600 },
);
