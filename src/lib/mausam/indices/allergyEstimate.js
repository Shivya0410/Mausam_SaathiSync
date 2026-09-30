// Allergy risk ESTIMATE (PRD section 6.6.8). Not a pollen count: India has
// no public pollen network. The UI must always say so. Pure.

/**
 * @param {object} c { month (1 to 12), pm10, windKmh, rh, rainingNow }
 * @returns {{ level: 'low'|'moderate'|'high', points: number }}
 */
export function allergyEstimate({ month, pm10, windKmh, rh, rainingNow = false }) {
  let points = 0;
  if ([2, 3, 4, 9, 10].includes(month)) points += 2;
  if (pm10 > 100) points += 2;
  else if (pm10 >= 60) points += 1;
  if (windKmh >= 10 && windKmh <= 30) points += 1;
  if (rh < 50) points += 1;
  if (rainingNow) points -= 1;
  const level = points >= 4 ? 'high' : points >= 2 ? 'moderate' : 'low';
  return { level, points };
}
