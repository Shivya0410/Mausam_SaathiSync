import { cachedPublicRoute } from '../../../../server/http/handler.js';
import { parseQuery, q } from '../../../../server/http/query.js';
import { buildSnapshot } from '../../../../lib/providers/snapshot.js';

export const dynamic = 'force-dynamic';

/** GET /api/mausam/air?lat&lon: AirQuality or null when unavailable. */
export const GET = cachedPublicRoute(
  async ({ request }) => {
    const p = parseQuery(new URL(request.url).searchParams, {
      lat: q.number({ min: -90, max: 90, required: true, decimals: 2 }),
      lon: q.number({ min: -180, max: 180, required: true, decimals: 2 }),
    });
    const snap = await buildSnapshot({ ...p, include: ['air'] });
    return { body: { air: snap.air, isDemo: snap.isDemo } };
  },
  { sMaxAge: 900, staleWhileRevalidate: 1800 },
);
