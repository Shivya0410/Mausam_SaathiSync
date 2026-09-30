import { authenticatedRoute } from '../../../../server/http/handler.js';
import { readJsonBody } from '../../../../server/http/validate.js';
import { createCheckIn } from '../../../../server/domains/checkIns.js';

export const dynamic = 'force-dynamic';

export const POST = authenticatedRoute(async ({ request, owner }) => {
  const body = await readJsonBody(request);
  const checkIn = await createCheckIn(owner.id, body);
  return { status: 201, body: { checkIn } };
});
