import { timingSafeEqual } from 'node:crypto';
import { publicRoute } from '../../../../../server/http/handler.js';
import { parseQuery, q } from '../../../../../server/http/query.js';
import { ApiError } from '../../../../../server/http/errors.js';
import { getRepositories } from '../../../../../server/repositories/index.js';
import { aggregateReports } from '../../../../../server/domains/reports.js';

export const dynamic = 'force-dynamic';

function authorised(request) {
  const expected = process.env.REPORTS_EXPORT_KEY;
  const given = request.headers.get('x-export-key') || '';
  if (!expected || expected.length < 16) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET /api/mausam/reports/export?format=geojson&since=ISO
 * Anonymised, aggregated grid cells for city disaster cells and IMD. Needs
 * the `x-export-key` header to match REPORTS_EXPORT_KEY (disabled when unset).
 */
export const GET = publicRoute(async ({ request }) => {
  if (!authorised(request)) throw ApiError.forbidden('Export needs a valid key.');
  const p = parseQuery(new URL(request.url).searchParams, {
    format: q.string({ oneOf: ['geojson'], fallback: 'geojson' }),
    since: q.string({ max: 40 }),
  });
  const since = p.since ? Date.parse(p.since) : Date.now() - 24 * 3600 * 1000;
  if (!Number.isFinite(since)) throw ApiError.validationFailed({ since: 'must be an ISO timestamp' });
  const reports = await getRepositories().reports.listSince(since);
  return { body: aggregateReports(reports, { since }) };
});
