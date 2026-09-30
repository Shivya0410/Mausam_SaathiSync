import { authenticatedRoute } from '../../../../../server/http/handler.js';
import { getSustainSummary } from '../../../../../server/domains/habits.js';

export const dynamic = 'force-dynamic';

export const GET = authenticatedRoute(async ({ owner }) => ({
  body: { summary: await getSustainSummary(owner.id) },
}));
