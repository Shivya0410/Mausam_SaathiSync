// Farm indices: spray window (PRD 6.6.6) and frost risk (6.6.7). Pure.

import { T } from '../thresholds.js';
import { isThunderCode } from '../wmo.js';
import { longestRun, hourIn } from './windows.js';
import { HOUR_MS } from '../time.js';

/**
 * Whether each hour is sprayable. Needs the following hours too, because an
 * hour is only sprayable if no rain is expected for the next 6 hours.
 * @param {Array} hours sorted hourly records
 * @returns {Array<object>} hours with { sprayable }
 */
export function markSprayable(hours) {
  const s = T.spray;
  return hours.map((h, i) => {
    const t = Date.parse(h.time);
    const ahead = hours.filter((x) => {
      const tx = Date.parse(x.time);
      return tx >= t && tx < t + (s.noRainHours + 1) * HOUR_MS;
    });
    const near = hours.filter((x) => Math.abs(Date.parse(x.time) - t) <= HOUR_MS);
    const sprayable =
      h.windKmh >= s.windMin &&
      h.windKmh <= s.windMax &&
      ahead.length >= Math.min(s.noRainHours + 1, hours.length - i) &&
      ahead.every((x) => (x.precipProb ?? 0) < s.rainProbMax && (x.precipMm ?? 0) < 0.5) &&
      h.tempC < s.tempMax &&
      h.rh > s.rhMin &&
      !near.some((x) => isThunderCode(x.wmo));
    return { ...h, sprayable };
  });
}

/** Spraying hours of the day: 05:00 to 11:00 and 16:00 to 19:00. */
const inSprayHours = (iso) => hourIn(iso, 5, 11) || hourIn(iso, 16, 19);

/**
 * Longest sprayable block within spraying hours, restricted to one local
 * date. Returns { start, end } (end exclusive) or null.
 */
export function sprayWindow(hours, date) {
  const marked = markSprayable(hours).filter((h) => h.time.startsWith(date));
  return longestRun(marked, (h) => h.sprayable && inSprayHours(h.time));
}

/**
 * Frost risk tonight: High if Tmin <= 2°C; Moderate if 2 to 4°C with clear
 * sky (cloud < 30%) and light wind (< 8 km/h); else Low.
 */
export function frostRisk({ tminC, cloudPct = 100, windKmh = 99 }) {
  if (!Number.isFinite(tminC)) return null;
  const f = T.frost;
  if (tminC <= f.high) return 'high';
  if (tminC <= f.moderate && cloudPct < f.clearSkyCloud && windKmh < f.calmWind) return 'moderate';
  return 'low';
}

/** Plain word for topsoil moisture (m³/m³). */
export function soilWord(m) {
  if (!Number.isFinite(m)) return null;
  if (m < T.soil.dryTopsoil) return 'dry';
  if (m < 0.3) return 'moist';
  return 'wet';
}

/** IMD 24 h rainfall category (Appendix A.1). */
export function rainfallCategory(mm) {
  if (!Number.isFinite(mm) || mm < 0.1) return 'none';
  if (mm < 2.5) return 'very_light';
  if (mm < 15.6) return 'light';
  if (mm < 64.5) return 'moderate';
  if (mm < 115.6) return 'heavy';
  if (mm < 204.5) return 'very_heavy';
  return 'extremely_heavy';
}
