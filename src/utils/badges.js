"use client";

import { loadForUser, saveForUser, userKey } from "./userScopedStorage.js";

/**
 * Badge + streak gamification store (per-user via userScopedStorage).
 *
 * Badge definitions carry title/description keys (i18n resolved by the UI),
 * an FA icon, and a color. `awardBadges(user, events)` is idempotent: it
 * only returns newly-earned badges so callers can toast exactly once.
 */

export const BADGE_DEFS = {
  first_step: { icon: "fa-solid fa-shoe-prints", color: "#7e57c2", nameKey: "badges.firstStep", descKey: "badges.firstStepD", requirement: "Log 1 Tracker pillar check-in (Yoga, Meditation, Diet, or Creative Hub)." },
  perfect_day: { icon: "fa-solid fa-star", color: "#f9a825", nameKey: "badges.perfectDay", descKey: "badges.perfectDayD", requirement: "Complete all 4 pillars on one calendar day." },
  week_warrior: { icon: "fa-solid fa-fire", color: "#e65100", nameKey: "badges.weekWarrior", descKey: "badges.weekWarriorD", requirement: "7 perfect 4/4 days in a single month." },
  month_master: { icon: "fa-solid fa-crown", color: "#6a1b9a", nameKey: "badges.monthMaster", descKey: "badges.monthMasterD", requirement: "20 perfect 4/4 days in a single month." },
  streak_7: { icon: "fa-solid fa-bolt", color: "#0288d1", nameKey: "badges.streak7", descKey: "badges.streak7D", requirement: "Log activity on 7 consecutive calendar days." },
  streak_30: { icon: "fa-solid fa-medal", color: "#c62828", nameKey: "badges.streak30", descKey: "badges.streak30D", requirement: "Log activity on 30 consecutive calendar days." },
  quiz_whiz: { icon: "fa-solid fa-brain", color: "#00897b", nameKey: "badges.quizWhiz", descKey: "badges.quizWhizD", requirement: "Finish the SheFit Myth-or-Fact quiz." },
  hydrated: { icon: "fa-solid fa-droplet", color: "#039be5", nameKey: "badges.hydrated", descKey: "badges.hydratedD", requirement: "Hit the daily water goal in SheFit." },
  community_voice: { icon: "fa-solid fa-bullhorn", color: "#5c6bc0", nameKey: "badges.communityVoice", descKey: "badges.communityVoiceD", requirement: "Clap or save 5 community stories." },
  early_bird: { icon: "fa-solid fa-sun", color: "#fb8c00", nameKey: "badges.earlyBird", descKey: "badges.earlyBirdD", requirement: "Log a check-in before 9:00 AM." },
  certified_finisher: { icon: "fa-solid fa-certificate", color: "#2e7d32", nameKey: "badges.certified", descKey: "badges.certifiedD", requirement: "Complete a month with 15+ active days." },
};

export const BADGE_TOTAL = Object.keys(BADGE_DEFS).length;

/** Earned/locked counts for progress display. Pure. */
export function badgeProgress(user) {
  const owned = new Set(getBadges(user));
  const earned = [...owned].filter((id) => BADGE_DEFS[id]).length;
  return { earned, locked: Math.max(0, BADGE_TOTAL - earned), total: BADGE_TOTAL };
}

const BASE = "swasth.badges.v1";

function readRawBadges(user) {
  const list = loadForUser(BASE, user, []);
  return Array.isArray(list) ? list : [];
}

/**
 * Normalize stored badges to records [{ id, earnedAt|null }].
 *
 * Backward compatible: legacy stores are plain id strings. They are kept
 * (badges never disappear) with earnedAt: null — the UI shows "Previously
 * earned" and never invents a historical date. Unknown ids are dropped.
 */
export function getBadgeRecords(user) {
  const out = [];
  for (const entry of readRawBadges(user)) {
    if (typeof entry === "string") {
      if (BADGE_DEFS[entry]) out.push({ id: entry, earnedAt: null });
    } else if (entry && typeof entry === "object" && BADGE_DEFS[entry.id]) {
      out.push({
        id: entry.id,
        earnedAt: typeof entry.earnedAt === "string" ? entry.earnedAt : null,
      });
    }
  }
  return out;
}

export function getBadges(user) {
  return getBadgeRecords(user).map((r) => r.id);
}

/**
 * Award badge ids; returns only the newly-earned ones. New unlocks record
 * an ISO timestamp; previously earned badges (with or without dates) are
 * preserved untouched, and duplicates are never re-awarded.
 */
export function awardBadges(user, ids) {
  const records = getBadgeRecords(user);
  const owned = new Set(records.map((r) => r.id));
  const fresh = [...new Set(ids)].filter((id) => BADGE_DEFS[id] && !owned.has(id));
  if (!fresh.length) return [];
  const now = new Date().toISOString();
  saveForUser(BASE, user, [...records, ...fresh.map((id) => ({ id, earnedAt: now }))]);
  return fresh;
}

export function badgeKey(user) {
  return userKey(BASE, user);
}

/** Longest run of consecutive YYYY-MM-DD dates ending at the latest date. */
export function currentStreak(dates) {
  if (!dates?.length) return 0;
  const set = new Set(dates);
  const sorted = [...set].sort();
  let streak = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const a = new Date(`${sorted[i]}T12:00:00`);
    const b = new Date(`${sorted[i - 1]}T12:00:00`);
    if ((a - b) / 86400000 === 1) streak++;
    else break;
  }
  return streak;
}

/** Level thresholds for the profile showcase. */
export function levelFor(badgeCount) {
  if (badgeCount >= 9) return "legend";
  if (badgeCount >= 6) return "champion";
  if (badgeCount >= 3) return "achiever";
  if (badgeCount >= 1) return "starter";
  return "newcomer";
}
