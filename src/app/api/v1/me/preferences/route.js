import { authenticatedRoute } from '../../../../../server/http/handler.js';
import { readJsonBody } from '../../../../../server/http/validate.js';
import { getPreferences, updatePreferences } from '../../../../../server/domains/preferences.js';

export const dynamic = 'force-dynamic';

export const GET = authenticatedRoute(async ({ owner }) => ({
  body: { preferences: await getPreferences(owner.id) },
}));

export const PATCH = authenticatedRoute(async ({ request, owner }) => {
  const body = await readJsonBody(request);
  return { body: { preferences: await updatePreferences(owner.id, body) } };
});
