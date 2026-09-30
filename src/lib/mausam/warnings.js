// Official warning status for the Now card chip and the alert ribbon
// (PRD sections 5.5, 7.3 and 12.5). Pure.
//
// The one rule that matters most here: when warnings could not be checked,
// the app must say so. It must never show "No warnings" for missing data.

/**
 * @param {object} snapshot WeatherSnapshot
 * @param {Date|number} now
 * @returns {{ state: 'unavailable'|'not_applicable'|'no_warnings'|'active', highest: object|null, count: number }}
 */
export function officialStatus(snapshot, now) {
  const status = snapshot?.warningsStatus;
  if (status === 'unavailable' || !snapshot) return { state: 'unavailable', highest: null, count: 0 };
  if (status === 'not_applicable') return { state: 'not_applicable', highest: null, count: 0 };
  const t = typeof now === 'number' ? now : new Date(now).getTime();
  const active = (snapshot.warnings || []).filter(
    (w) => w.level >= 2 && (!w.validTo || Date.parse(w.validTo) > t) && (!w.validFrom || Date.parse(w.validFrom) <= t),
  );
  if (!active.length) return { state: 'no_warnings', highest: null, count: 0 };
  const highest = active.reduce((a, b) => (b.level > a.level ? b : a));
  return { state: 'active', highest, count: active.length };
}

/** Warnings loud enough for the alert ribbon: Orange or Red, active now. */
export function ribbonWarnings(snapshot, now) {
  const t = typeof now === 'number' ? now : new Date(now).getTime();
  return (snapshot?.warnings || [])
    .filter((w) => w.level >= 3 && (!w.validTo || Date.parse(w.validTo) > t) && (!w.validFrom || Date.parse(w.validFrom) <= t))
    .sort((a, b) => b.level - a.level);
}
