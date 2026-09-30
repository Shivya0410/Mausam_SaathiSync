/**
 * Dashboard read model.
 *
 * Composes across domains, which is the point: it demonstrates that a single
 * request can fan out to several services and still be owner-scoped
 * throughout, because every call below is passed the verified owner id.
 *
 * Section 7.1 forbids presenting seeded values as measurements. Everything
 * here is derived from what the owner actually logged, and where nothing has
 * been logged the response says so rather than substituting a plausible
 * number. The placeholder figures in src/data/demoStats.js are a UI concern
 * and are not read here.
 */

import { getPreferences } from './preferences.js';
import { findCheckIn } from './checkIns.js';
import { getSustainSummary } from './habits.js';

export async function getDashboard(ownerId, localDate) {
  const [preferences, checkIn, sustain] = await Promise.all([
    getPreferences(ownerId),
    localDate ? findCheckIn(ownerId, localDate) : Promise.resolve(null),
    getSustainSummary(ownerId),
  ]);

  return {
    preferences,
    today: {
      localDate: localDate ?? null,
      checkIn,
      checkInCompleted: checkIn !== null,
    },
    sustain,
    // Explicit rather than implied by empty objects, so a client renders an
    // empty state instead of zeroes that look like real measurements.
    hasAnyActivity: sustain.entryCount > 0 || checkIn !== null,
  };
}
