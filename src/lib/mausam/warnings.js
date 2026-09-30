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

/**
 * Official warnings grouped by local date for the next `days` days (PRD 7.2
 * "Next 5 days"). Each day has the highest level and its hazards. Pure.
 */
export function warningsByDay(warnings, today, days = 5) {
  const out = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    const date = d.toISOString().slice(0, 10);
    const list = (warnings || []).filter((w) => {
      const from = (w.validFrom || w.issuedAt || '').slice(0, 10) || date;
      const to = (w.validTo || '9999-12-31').slice(0, 10);
      return from <= date && to >= date && w.level >= 2;
    });
    out.push({
      date,
      level: list.length ? Math.max(...list.map((w) => w.level)) : 1,
      hazards: [...new Set(list.map((w) => w.hazard))],
      warnings: list.sort((a, b) => b.level - a.level),
    });
  }
  return out;
}

/** Split warnings into the Alerts page sections. Pure. */
export function alertSections(warnings) {
  const list = warnings || [];
  return {
    nowcast: list.filter((w) => w.source === 'imd_nowcast'),
    district: list.filter((w) => w.source === 'imd_district' || w.source === 'imd_highway'),
    disaster: list.filter((w) => w.source === 'ndma_cap'),
    marine: list.filter((w) => w.source === 'imd_marine' || (w.hazard === 'high_waves' && w.source !== 'ndma_cap')),
    cyclone: list.filter((w) => w.hazard === 'cyclone' || w.source === 'imd_cyclone'),
  };
}
