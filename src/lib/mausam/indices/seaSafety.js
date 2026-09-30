// Sea safety verdict (PRD 6.6.9), fisher verdict and tide extrema. Pure.

import { T } from '../thresholds.js';

/**
 * @param {object} c
 * @param {number} [c.waveM]
 * @param {number} [c.swellM]
 * @param {number} [c.swellPeriodS]
 * @param {number} [c.windKmh]
 * @param {number} [c.gustKmh]
 * @param {boolean} [c.officialWarning] high-wave, swell or coastal warning
 * @param {boolean} [c.cycloneWarning]
 * @param {boolean} [c.thunderNext3h]
 * @param {boolean} [c.nearLowTide] within 1 h of low tide
 * @param {boolean} [c.ripProne] beach is marked rip-prone
 * @returns {{ verdict: 'stay_out'|'caution'|'safe', reasons: string[] }}
 */
export function seaVerdict(c = {}) {
  const s = T.sea;
  const stay = [];
  if (c.officialWarning) stay.push('official');
  if (c.cycloneWarning) stay.push('cyclone');
  if (c.waveM >= s.stayOutWave) stay.push('waves');
  if (c.swellM >= s.longSwellHeight && c.swellPeriodS >= s.longSwellPeriod) stay.push('long_swell');
  if (c.thunderNext3h) stay.push('thunder');
  if (c.gustKmh >= s.stayOutGust) stay.push('gusts');
  if (stay.length) return { verdict: 'stay_out', reasons: stay };

  const caution = [];
  if (c.waveM >= s.cautionWave) caution.push('waves');
  if (c.swellPeriodS >= s.cautionPeriod) caution.push('swell_period');
  if (c.windKmh >= s.cautionWind) caution.push('wind');
  if (c.nearLowTide && c.ripProne) caution.push('rip_low_tide');
  if (caution.length) return { verdict: 'caution', reasons: caution };
  return { verdict: 'safe', reasons: [] };
}

/**
 * Fisher verdict: an IMD fishermen warning decides when present; otherwise
 * wind >= 45 km/h or waves >= 2.5 m mean "not safe for small boats".
 */
export function fisherVerdict({ officialWarning = false, maxWindKmh, maxWaveM } = {}) {
  if (officialWarning) return { verdict: 'no_go', reason: 'official' };
  if (maxWindKmh >= T.sea.fisherWind) return { verdict: 'no_go', reason: 'wind' };
  if (maxWaveM >= T.sea.fisherWave) return { verdict: 'no_go', reason: 'waves' };
  return { verdict: 'go', reason: null };
}

/** Plain word for wave height (Appendix A.5). */
export function seaStateWord(waveM) {
  if (!Number.isFinite(waveM)) return null;
  if (waveM < 0.5) return 'calm';
  if (waveM < 1.25) return 'slight';
  if (waveM < 2.5) return 'moderate';
  if (waveM <= 4) return 'rough';
  return 'very_rough';
}

/** Comfort word for sea-surface temperature. */
export function waterTempWord(sstC) {
  if (!Number.isFinite(sstC)) return null;
  if (sstC < 24) return 'cool';
  if (sstC <= 28) return 'pleasant';
  return 'warm';
}

/**
 * High and low tides from an hourly sea-level series (local extrema).
 * Never invents tides: returns [] when the series is missing or too short.
 * @param {Array<{time:string, seaLevelM:number|null}>} series
 */
export function tideExtrema(series) {
  const pts = (series || []).filter((p) => Number.isFinite(p.seaLevelM));
  if (pts.length < 3 || pts.length !== (series || []).length) return [];
  const out = [];
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, b, c] = [pts[i - 1].seaLevelM, pts[i].seaLevelM, pts[i + 1].seaLevelM];
    if (b > a && b >= c) out.push({ time: pts[i].time, type: 'high', heightM: b });
    else if (b < a && b <= c) out.push({ time: pts[i].time, type: 'low', heightM: b });
  }
  return out;
}
