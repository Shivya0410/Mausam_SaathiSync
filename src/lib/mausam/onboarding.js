// Persona suggestions for onboarding (PRD 3.5, layer 3). Pure.
// Suggestions are highlighted tiles, never selected automatically.

import { haversineKm } from './geo.js';

/**
 * @param {object} a
 * @param {object} a.place { lat, lon, featureCode? }
 * @param {number} a.month 1 to 12
 * @param {Array} a.beaches [{ lat, lon }]
 * @returns {string[]} suggested persona ids
 */
export function suggestPersonas({ place, month, beaches = [] }) {
  const out = [];
  if (!place || !Number.isFinite(place.lat)) return out;
  // "Within 5 km of the coast": the nearest listed beach is the proxy we have.
  const nearSea = beaches.some((b) => haversineKm(place, b) <= 5) || place.isCoastal === true;
  if (nearSea) out.push('coast');
  // A populated place that is not an administrative seat reads as rural.
  if (place.featureCode === 'PPL') out.push('farm');
  // Winter smog season in North India.
  if ([11, 12, 1, 2].includes(month) && place.lat >= 23) out.push('health');
  return out;
}
