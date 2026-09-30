// IMD's four seasons by month (PRD section 5.11). Pure.
//
// Winter: January, February. Summer (pre-monsoon): March to May.
// Monsoon: June to September. Post-monsoon: October to December.

/** States where the northeast monsoon (October to December) brings the main rains. */
export const NORTHEAST_MONSOON_STATES = new Set([
  'Tamil Nadu',
  'Puducherry',
  'Kerala',
  'Andhra Pradesh',
]);

export function seasonOfMonth(month) {
  if (month <= 2) return 'winter';
  if (month <= 5) return 'summer';
  if (month <= 9) return 'monsoon';
  return 'postMonsoon';
}

/**
 * @param {number} month 1 to 12
 * @param {string} [state]
 * @returns {{ season: string, northeastMonsoon: boolean }}
 */
export function seasonFor(month, state) {
  const season = seasonOfMonth(month);
  return {
    season,
    northeastMonsoon: season === 'postMonsoon' && NORTHEAST_MONSOON_STATES.has(state),
  };
}
