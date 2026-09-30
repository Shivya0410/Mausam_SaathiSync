/**
 * Configurable XP policy (local preview only).
 *
 * This is NOT server-validated and NOT tamper-proof: it runs in the browser
 * over this browser's tracker check-ins. Any UI showing these points must
 * label them as a preview and show XP_POLICY_VERSION. A future durable
 * backend may adopt the same versioned shape, but local totals must never be
 * presented as verified server data.
 */

import { weekStartMonday } from "../lib/activityModel.js";

// v2 corrects the weekly cap to Monday–Sunday weeks in the user's local
// calendar (v1 approximated it with a calendar-month rollup that rarely
// bound). Daily values are unchanged: 10 XP per pillar, +10 for 4/4,
// capped at 50/day. A perfect 7-day week (7×50) exactly reaches the cap.
export const XP_POLICY_VERSION = 2;

export const XP_POLICY = {
  version: XP_POLICY_VERSION,
  // Points per checked pillar per day (Y=yoga, M=meditation, E=diet, C=creative).
  pointsPerPillar: { Y: 10, M: 10, E: 10, C: 10 },
  // Bonus when all four pillars are checked on the same calendar day.
  perfectDayBonus: 10,
  // Anti-farming caps for the local preview.
  caps: {
    maxPillarsPerDay: 4,
    maxPointsPerDay: 50, // 4x10 + 10 bonus
    maxPointsPerWeek: 350, // Monday–Sunday, local calendar dates
  },
  note: "Local preview. Resets if browser data is cleared. Not synced.",
};

// PROVISIONAL XP-based wellness levels (participation/progression only —
// never a medical or health status). Thresholds are configurable here so no
// JSX hardcodes them. Values are provisional placeholders until the product
// team approves final thresholds; the UI labels them as such.
export const XP_LEVELS = [
  { minXp: 0, name: "Seedling" },
  { minXp: 100, name: "Sprout" },
  { minXp: 300, name: "Groove" },
  { minXp: 600, name: "Rhythm" },
  { minXp: 1000, name: "Flow" },
];

/**
 * Level for a total XP value. Returns { name, index, minXp,
 * nextMinXp|null, xpIntoLevel, xpForNext|null }.
 */
export function xpLevelFor(totalXp) {
  const total = Math.max(0, Number(totalXp) || 0);
  let index = 0;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (total >= XP_LEVELS[i].minXp) index = i;
  }
  const level = XP_LEVELS[index];
  const next = XP_LEVELS[index + 1] || null;
  return {
    name: level.name,
    index,
    minXp: level.minXp,
    nextMinXp: next ? next.minXp : null,
    nextName: next ? next.name : null,
    xpIntoLevel: total - level.minXp,
    xpForNext: next ? next.minXp - total : null,
  };
}

/**
 * Points for one day's checked pillars (array of pillar codes).
 */
export function xpForDay(pillars, policy = XP_POLICY) {
  const unique = [...new Set(pillars)].filter((p) =>
    Object.hasOwn(policy.pointsPerPillar, p)
  );
  const capped = unique.slice(0, policy.caps.maxPillarsPerDay);
  let pts = capped.reduce((n, p) => n + policy.pointsPerPillar[p], 0);
  if (capped.length === 4) pts += policy.perfectDayBonus;
  return Math.min(pts, policy.caps.maxPointsPerDay);
}

/**
 * Preview totals for qualifying events [{date, pillar}].
 * Returns { total, byDay: {date: points}, daysCounted, policyVersion }.
 *
 * Derived, never stored: duplicate {date, pillar} pairs are counted once,
 * each day is capped per policy, and each Monday–Sunday week (local calendar
 * dates via weekStartMonday) is capped at maxPointsPerWeek. Dates that fail
 * week bucketing fall back to their own week so no points are silently lost.
 */
export function xpPreviewForEvents(events, policy = XP_POLICY) {
  const seen = new Set();
  const byDate = new Map();
  for (const e of events || []) {
    if (!e || typeof e.date !== "string") continue;
    if (!Object.hasOwn(policy.pointsPerPillar, e.pillar)) continue;
    const key = `${e.date}|${e.pillar}`;
    if (seen.has(key)) continue; // duplicate protection
    seen.add(key);
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date).push(e.pillar);
  }
  const dates = [...byDate.keys()].sort();
  const byDay = {};
  let total = 0;
  let weekBucket = null;
  let weekTotal = 0;
  for (const date of dates) {
    const week = weekStartMonday(date) || `invalid:${date}`;
    if (week !== weekBucket) {
      weekBucket = week;
      weekTotal = 0;
    }
    const room = Math.max(0, policy.caps.maxPointsPerWeek - weekTotal);
    const pts = Math.min(xpForDay(byDate.get(date), policy), room);
    weekTotal += pts;
    byDay[date] = pts;
    total += pts;
  }
  return { total, byDay, daysCounted: dates.length, policyVersion: policy.version };
}
