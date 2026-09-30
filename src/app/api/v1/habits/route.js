import { authenticatedRoute } from '../../../../server/http/handler.js';
import { readJsonBody } from '../../../../server/http/validate.js';
import { logHabit } from '../../../../server/domains/habits.js';

export const dynamic = 'force-dynamic';

export const POST = authenticatedRoute(async ({ request, owner }) => {
  const body = await readJsonBody(request);
  const idempotencyKey = request.headers.get('idempotency-key');

  const { record, replayed } = await logHabit(owner.id, body, idempotencyKey);

  // 200 on a replay, 201 on a genuine create, so a caller can tell whether its
  // retry actually wrote anything.
  return { status: replayed ? 200 : 201, body: { habit: record, replayed } };
});
