import { cachedPublicRoute, publicRoute } from '../../../../server/http/handler.js';
import { parseQuery, q } from '../../../../server/http/query.js';
import { readJsonBody } from '../../../../server/http/validate.js';
import { createLimiter, clientIp } from '../../../../server/http/rateLimit.js';
import { getRepositories } from '../../../../server/repositories/index.js';
import { createReport, listReports, REPORT_TYPES } from '../../../../server/domains/reports.js';

export const dynamic = 'force-dynamic';

const limitIp = createLimiter({ limit: 30, windowMs: 60 * 60 * 1000 });

/** GET /api/mausam/reports?lat&lon&radiusKm&types: active crowd reports nearby. */
export const GET = cachedPublicRoute(
  async ({ request }) => {
    const p = parseQuery(new URL(request.url).searchParams, {
      lat: q.number({ min: -90, max: 90, required: true, decimals: 3 }),
      lon: q.number({ min: -180, max: 180, required: true, decimals: 3 }),
      radiusKm: q.number({ min: 0.1, max: 25 }),
      types: q.list({ allowed: REPORT_TYPES, max: 3, fallback: REPORT_TYPES }),
    });
    const reports = await listReports(getRepositories(), { ...p, radiusKm: p.radiusKm ?? 5 });
    return { body: { reports, durable: getRepositories().describe().durable } };
  },
  { sMaxAge: 30, staleWhileRevalidate: 60 },
);

/** POST /api/mausam/reports: body per PRD 11.2. No photo, no free text. */
export const POST = publicRoute(async ({ request }) => {
  limitIp(clientIp(request));
  const body = await readJsonBody(request);
  const report = await createReport(getRepositories(), body);
  return { status: 201, body: { report } };
});
