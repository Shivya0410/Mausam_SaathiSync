import { publicRoute } from '../../../../../../server/http/handler.js';
import { readJsonBody } from '../../../../../../server/http/validate.js';
import { createLimiter, clientIp } from '../../../../../../server/http/rateLimit.js';
import { getRepositories } from '../../../../../../server/repositories/index.js';
import { voteReport } from '../../../../../../server/domains/reports.js';

export const dynamic = 'force-dynamic';

const limitIp = createLimiter({ limit: 120, windowMs: 60 * 60 * 1000 });

/** POST /api/mausam/reports/:id/vote { vote: 'still'|'cleared', clientId } */
export const POST = publicRoute(async ({ request, routeContext }) => {
  limitIp(clientIp(request));
  const { id } = await routeContext.params;
  const body = await readJsonBody(request);
  const report = await voteReport(getRepositories(), String(id).slice(0, 64), body);
  return { body: { report } };
});
