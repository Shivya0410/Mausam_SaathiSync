"use client";

import React, { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { saveForUser, userKey } from "../../utils/userScopedStorage";
import { localTodayISO, weekStartMonday } from "../../lib/activityModel";
import {
  getWeeklyGoalsServerSnapshot,
  getWeeklyGoalsSnapshot,
  notifyWeeklyGoalsChanged,
  subscribeToWeeklyGoalsStore,
} from "../../lib/weeklyGoalsStore";
import {
  GOAL_STORE_KEY as WEEKLY_GOAL_STORE_KEY,
  createGoal,
  goalProgress,
  updateGoalInList,
  validateGoalInput,
} from "../../lib/weeklyGoalsModel";

/**
 * Editable weekly goals, stored per-user in this browser only.
 * Progress counts QUALIFYING tracker check-ins (Y/M/E/C) in the goal week.
 * Never merged across accounts; guest goals stay under the guest namespace.
 * Goals can be edited in place (no delete/recreate needed); edits preserve
 * the goal id so progress continuity is never broken or duplicated.
 */
const PILLAR_LABELS = { Y: "Yoga", M: "Meditation", E: "Healthy Diet", C: "Creative Hub" };

export default function WeeklyGoals({ user, isLoggedIN, events }) {
  const storageKey = userKey(WEEKLY_GOAL_STORE_KEY, user);
  // Snapshots are cached per key (see src/lib/weeklyGoalsStore.js): returning
  // a fresh array on every getSnapshot/getServerSnapshot call makes React loop
  // ("getSnapshot should be cached" -> "Maximum update depth exceeded").
  // Server snapshot is always empty so prerender/hydration match; the browser
  // picks up this account's goals via subscription (no setState-in-effect).
  const getSnapshot = useCallback(() => getWeeklyGoalsSnapshot(storageKey), [storageKey]);
  const goals = useSyncExternalStore(
    subscribeToWeeklyGoalsStore,
    getSnapshot,
    getWeeklyGoalsServerSnapshot
  );
  const [pillar, setPillar] = useState("Y");
  const [target, setTarget] = useState(3);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editPillar, setEditPillar] = useState("Y");
  const [editTarget, setEditTarget] = useState(3);
  const [editError, setEditError] = useState("");

  const persist = (next) => {
    saveForUser(WEEKLY_GOAL_STORE_KEY, user, next);
    notifyWeeklyGoalsChanged();
  };

  const weekStart = useMemo(() => weekStartMonday(localTodayISO()), []);

  const progressOf = (goal) => goalProgress(goal, events);

  const addGoal = (e) => {
    e.preventDefault();
    const err = validateGoalInput({ pillar, target }, goals.length);
    setError(err);
    if (err) return;
    persist([...goals, createGoal({ pillar, target, weekStart })]);
  };

  const removeGoal = (id) => {
    if (editingId === id) {
      setEditingId(null);
      setEditError("");
    }
    persist(goals.filter((g) => g.id !== id));
  };

  const startEdit = (goal) => {
    setEditingId(goal.id);
    setEditPillar(goal.pillar);
    setEditTarget(goal.target);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError("");
  };

  const saveEdit = (id) => {
    const others = goals.filter((g) => g.id !== id).length;
    const err = validateGoalInput({ pillar: editPillar, target: editTarget }, others);
    setEditError(err);
    if (err) return;
    persist(updateGoalInList(goals, id, { pillar: editPillar, target: Number(editTarget) }));
    setEditingId(null);
    setEditError("");
  };

  return (
    <div className="profile-goals">
      <p className="profile-local-note">Saved in this browser only · per account · not synced</p>
      {goals.length === 0 ? (
        <p className="profile-muted" role="status">
          No weekly goals yet. Set one below — progress counts completed Tracker check-ins this week.
        </p>
      ) : (
        <ul className="profile-goals-list">
          {goals.map((g) => {
            const done = progressOf(g);
            const pct = Math.min(100, Math.round((done / g.target) * 100));
            const complete = done >= g.target;
            const isEditing = editingId === g.id;
            return (
              <li key={g.id} className="profile-goal">
                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveEdit(g.id);
                    }}
                    className="profile-goals-form"
                    aria-label={`Edit ${PILLAR_LABELS[g.pillar] || g.pillar} goal`}
                  >
                    <label>
                      Pillar
                      <select value={editPillar} onChange={(e) => setEditPillar(e.target.value)} aria-label="Edited goal pillar">
                        <option value="Y">Yoga (Y)</option>
                        <option value="M">Meditation (M)</option>
                        <option value="E">Healthy Diet (E)</option>
                        <option value="C">Creative Hub (C)</option>
                      </select>
                    </label>
                    <label>
                      Sessions this week (1–7)
                      <input
                        type="number"
                        min={1}
                        max={7}
                        value={editTarget}
                        onChange={(e) => setEditTarget(e.target.value)}
                        aria-label="Edited weekly target sessions"
                      />
                    </label>
                    <button type="submit">Save</button>
                    <button type="button" onClick={cancelEdit}>
                      Cancel
                    </button>
                    {editError && (
                      <p className="profile-form-error" role="alert">
                        {editError}
                      </p>
                    )}
                  </form>
                ) : (
                  <>
                    <div className="profile-goal-top">
                      <strong>
                        {PILLAR_LABELS[g.pillar] || g.pillar} — {done}/{g.target} this week
                      </strong>
                      <span className="profile-goal-actions">
                        <button type="button" onClick={() => startEdit(g)} aria-label={`Edit ${g.pillar} goal`}>
                          Edit
                        </button>
                        <button type="button" onClick={() => removeGoal(g.id)} aria-label={`Delete ${g.pillar} goal`}>
                          Delete
                        </button>
                      </span>
                    </div>
                    <div className="profile-goal-bar" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={g.target} aria-label={`${g.pillar} goal progress`}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <small>{complete ? "Completed — nice consistency." : `Week of ${g.weekStart} · ${Math.max(0, g.target - done)} to go.`}</small>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={addGoal} className="profile-goals-form">
        <label>
          Pillar
          <select value={pillar} onChange={(e) => setPillar(e.target.value)} aria-label="Goal pillar">
            <option value="Y">Yoga (Y)</option>
            <option value="M">Meditation (M)</option>
            <option value="E">Healthy Diet (E)</option>
            <option value="C">Creative Hub (C)</option>
          </select>
        </label>
        <label>
          Sessions this week (1–7)
          <input type="number" min={1} max={7} value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Weekly target sessions" />
        </label>
        <button type="submit">Add goal</button>
      </form>
      {error && (
        <p className="profile-form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
