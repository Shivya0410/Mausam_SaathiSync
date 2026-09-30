import { publicRoute } from '../../../../server/http/handler.js';
import { getRepositories } from '../../../../server/repositories/index.js';

export const dynamic = 'force-dynamic';

const SCHEMA_VERSION = '1.0.0';

/**
 * Service health and configuration.
 *
 * Reports which persistence adapter is live and whether it is durable, so the
 * fact that data does not currently survive a restart is visible at runtime
 * rather than buried in a source comment.
 *
 * Deliberately reports no secrets, no connection strings and no upstream URLs.
 */
export const GET = publicRoute(async () => {
  const repositories = getRepositories();
  const persistence = repositories.describe();

  return {
    body: {
      status: 'ok',
      schemaVersion: SCHEMA_VERSION,
      persistence: {
        adapter: persistence.name,
        durable: persistence.durable,
        note: persistence.durable
          ? undefined
          : 'Data is held in process memory and is lost on restart or redeploy. Not a production store.',
      },
      features: {
        conditionSuggestions:
          process.env.NEXT_PUBLIC_ENABLE_CONDITION_SUGGESTIONS === 'true',
        cvPractice: process.env.FEATURE_CV_PRACTICE === 'true',
        recommendationMode: process.env.RECOMMENDATION_MODE || 'demo',
      },
      recommender: {
        configured: Boolean(process.env.RECOMMENDER_BASE_URL),
        note: 'The Python recommendation service is not implemented. See contracts/api-v1.md.',
      },
    },
  };
});
