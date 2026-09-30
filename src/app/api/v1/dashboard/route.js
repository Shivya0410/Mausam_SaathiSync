import { authenticatedRoute } from '../../../../server/http/handler.js';
import { getDashboard } from '../../../../server/domains/dashboard.js';

export const dynamic = 'force-dynamic';

export const GET = authenticatedRoute(async ({ request, owner }) => {
  // The browser supplies its own local date; a server in another timezone
  // would roll the day over at the wrong moment for the user.
  const localDate = new URL(request.url).searchParams.get('localDate');
  return { body: { dashboard: await getDashboard(owner.id, localDate) } };
});
