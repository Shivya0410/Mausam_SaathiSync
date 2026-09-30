/**
 * Pure weekly-goal helpers (no storage, no JSX) so goal logic is unit
 * testable. Storage stays per-user in the component via userScopedStorage
 * under GOAL_STORE_KEY; goals are never merged across accounts.
 */

import { PILLAR_CODES, isDateInWeek } from "./activityModel.js";

export const GOAL_STORE_KEY = "swasth.goals.v1";
export const MAX_GOALS = 6;
export const MIN_TARGET = 1;
export const MAX_TARGET = 7;

export function newGoalId() {
  return `g-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/** Validate pillar/target. Returns "" when valid, else an error message. */
export function validateGoalInput({ pillar, target }, existingCount = 0) {
  if (!PILLAR_CODES.includes(pillar)) {
    return "Choose Yoga, Meditation, Diet, or Creative Hub.";
  }
  const t = Number(target);
  if (!Number.isInteger(t) || t < MIN_TARGET || t > MAX_TARGET) {
    return `Target must be ${MIN_TARGET}–${MAX_TARGET} sessions this week.`;
  }
  if (existingCount >= MAX_GOALS) {
    return `Up to ${MAX_GOALS} goals. Delete one to add another.`;
  }
  return "";
}

export function createGoal({ pillar, target, weekStart }) {
  return {
    id: newGoalId(),
    pillar,
    target: Number(target),
    weekStart,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Replace one goal by id, preserving id/weekStart/createdAt unless the patch
 * overrides pillar/target (validated). Never duplicates: unknown ids return
 * the list unchanged.
 */
export function updateGoalInList(goals, id, patch) {
  const list = Array.isArray(goals) ? goals : [];
  let changed = false;
  const next = list.map((g) => {
    if (!g || g.id !== id) return g;
    changed = true;
    const pillar = patch.pillar !== undefined ? patch.pillar : g.pillar;
    const target = patch.target !== undefined ? Number(patch.target) : g.target;
    return { ...g, pillar, target };
  });
  return changed ? next : list;
}

/** Count qualifying events for a goal's pillar inside its week. */
export function goalProgress(goal, events) {
  if (!goal || !PILLAR_CODES.includes(goal.pillar)) return 0;
  let n = 0;
  for (const e of events || []) {
    if (e.pillar !== goal.pillar) continue;
    if (isDateInWeek(e.date, goal.weekStart)) n += 1;
  }
  return n;
}
