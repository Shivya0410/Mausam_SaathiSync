import { publicRoute } from '../../../../server/http/handler.js';
import { readJsonBody } from '../../../../server/http/validate.js';
import { createLimiter, clientIp } from '../../../../server/http/rateLimit.js';
import { getRepositories } from '../../../../server/repositories/index.js';
import { createFeedback } from '../../../../server/domains/reports.js';

export const dynamic = 'force-dynamic';

const limitIp = createLimiter({ limit: 20, windowMs: 60 * 60 * 1000 });

/** POST /api/mausam/feedback { kind, ruleId?, helpful?, message?, lang, page } */
export const POST = publicRoute(async ({ request }) => {
  limitIp(clientIp(request));
  const body = await readJsonBody(request);
  const item = await createFeedback(getRepositories(), body);
  return { status: 201, body: { feedback: item } };
});
