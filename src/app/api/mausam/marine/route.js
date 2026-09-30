import { cachedPublicRoute } from '../../../../server/http/handler.js';
import { parseQuery, q } from '../../../../server/http/query.js';
import { fetchMarine } from '../../../../lib/providers/openMeteo/marine.js';

export const dynamic = 'force-dynamic';

/** GET /api/mausam/marine?lat&lon: Marine, or null for inland points. */
export const GET = cachedPublicRoute(
  async ({ request }) => {
    const p = parseQuery(new URL(request.url).searchParams, {
      lat: q.number({ min: -90, max: 90, required: true, decimals: 2 }),
      lon: q.number({ min: -180, max: 180, required: true, decimals: 2 }),
    });
    const r = await fetchMarine(p);
    return { body: { marine: r.ok ? r.data : null, status: r.ok ? 'ok' : r.reason === 'no_data' ? 'not_available' : 'unavailable' } };
  },
  { sMaxAge: 900, staleWhileRevalidate: 1800 },
);
