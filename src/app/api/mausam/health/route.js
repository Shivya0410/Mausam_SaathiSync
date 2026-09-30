import { publicRoute } from '../../../../server/http/handler.js';
import { getRepositories } from '../../../../server/repositories/index.js';
import { providerStatus } from '../../../../lib/providers/status.js';
import { imdEnabled } from '../../../../lib/providers/imd/index.js';
import { sachetFeeds } from '../../../../lib/providers/sachet/cap.js';

export const dynamic = 'force-dynamic';

/**
 * Provider status for the About page and monitoring (PRD 22.3). Reports
 * which sources are configured and how they behaved in the last hour. No
 * secrets, keys or upstream URLs are included.
 */
export const GET = publicRoute(async () => {
  const persistence = getRepositories().describe();
  return {
    body: {
      status: 'ok',
      configured: {
        imd: imdEnabled(),
        sachet: sachetFeeds().length > 0,
        cpcb: Boolean(process.env.DATA_GOV_IN_API_KEY),
        openMeteo: true,
        aviationWeather: true,
        demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
        forceFixtures: process.env.FORCE_FIXTURES === 'true',
      },
      providers: providerStatus(),
      persistence: { adapter: persistence.name, durable: persistence.durable },
    },
  };
});
