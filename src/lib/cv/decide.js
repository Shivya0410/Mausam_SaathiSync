// Turning model output into honest words and decisions (PRD 11.1, 11.2,
// 20.11). Pure.

import { thunderProb } from '../mausam/rules/general.js';
import { T } from '../mausam/thresholds.js';

export const SKY_THRESHOLDS = Object.freeze({ accept: 0.55, top2Gap: 0.15 });
export const FLOOD_THRESHOLDS = Object.freeze({ aiVerified: 0.7, unverified: 0.5 });

/** Confidence as words (PRD 20.11). */
export function confidenceWord(p) {
  if (p >= 0.85) return 'veryLikely';
  if (p >= 0.7) return 'likely';
  if (p >= 0.55) return 'possibly';
  return 'notSure';
}

/**
 * Sky Snap: accept top-1 if >= 0.55 and not the "none" (not sky) class;
 * mention top-2 when within 15 points.
 * @param {Array<{label, p}>} probs any order
 */
export function skyDecision(probs) {
  const top = [...probs].sort((a, b) => b.p - a.p);
  const [a, b] = top;
  if (!a) return { status: 'unsure', top: [] };
  if (a.label === 'none') return { status: 'notSky', top: top.slice(0, 2) };
  if (a.p < SKY_THRESHOLDS.accept) return { status: 'unsure', top: top.slice(0, 2) };
  const alt = b && b.label !== 'none' && a.p - b.p < SKY_THRESHOLDS.top2Gap ? b : null;
  return { status: 'ok', label: a.label, p: a.p, alt, top: top.slice(0, 2) };
}

/**
 * Jal-Bharav: 3 classes flooded_street, wet_not_flooded, not_relevant.
 * >= 0.70 AI-verified; 0.50 to 0.69 unverified; below that cannot submit.
 */
export function floodDecision(probs) {
  const p = probs.find((x) => x.label === 'flooded_street')?.p ?? 0;
  const status = p >= FLOOD_THRESHOLDS.aiVerified ? 'ai_verified' : p >= FLOOD_THRESHOLDS.unverified ? 'unverified' : 'reject';
  const other = [...probs].filter((x) => x.label !== 'flooded_street').sort((a, b) => b.p - a.p)[0] || null;
  return { status, p, other };
}

/**
 * What the forecast says about storms in the next few hours, for the Sky
 * Snap result (PRD 11.1 "Combining with the forecast"). Pure over hours.
 */
export function stormContext(hours, warnings = []) {
  const storm = hours.find((h) => thunderProb(h) >= T.thunder.probNext3h);
  const nowcast = warnings.find((w) => w.source === 'imd_nowcast' && ['thunderstorm', 'lightning', 'squall', 'hailstorm'].includes(w.hazard));
  return { stormAt: storm ? storm.time : null, nowcast: nowcast || null };
}
