"use client";

import React, { useMemo } from "react";
import { XP_POLICY, xpLevelFor, xpPreviewForEvents } from "../../config/xpPolicy";

/**
 * Local XP preview. Explicitly NOT server-validated or tamper-proof.
 * Totals derive from this browser's qualifying check-ins under the
 * versioned policy shown below. Levels are participation/progression
 * markers only — never a medical or health status.
 */
export default function XpPreview({ events }) {
  const preview = useMemo(() => xpPreviewForEvents(events), [events]);
  const level = useMemo(() => xpLevelFor(preview.total), [preview.total]);
  const levelPct = level.xpForNext === null
    ? 100
    : Math.min(100, Math.round((level.xpIntoLevel / (level.xpIntoLevel + level.xpForNext)) * 100));

  return (
    <div className="profile-xp" aria-label="Local XP preview">
      <p className="profile-local-note">
        Preview only · v{XP_POLICY.version} · this browser · not synced · not tamper-proof
      </p>
      <div className="profile-xp-total">
        <strong>{preview.total} XP</strong>
        <span>
          {preview.daysCounted} active day{preview.daysCounted === 1 ? "" : "s"} · {XP_POLICY.pointsPerPillar.Y} XP per
          pillar · +{XP_POLICY.perfectDayBonus} for 4/4 days · capped at {XP_POLICY.caps.maxPointsPerDay}/day ·{" "}
          {XP_POLICY.caps.maxPointsPerWeek}/week (Mon–Sun)
        </span>
      </div>
      <div className="profile-xp-level">
        <strong>
          Level: {level.name}
          {level.nextName ? ` · ${level.xpForNext} XP to ${level.nextName}` : " · max provisional level"}
        </strong>
        <div
          className="profile-goal-bar"
          role="progressbar"
          aria-valuenow={level.xpIntoLevel}
          aria-valuemin={0}
          aria-valuemax={level.xpIntoLevel + (level.xpForNext || 0)}
          aria-label={`Progress to ${level.nextName || "max level"}`}
        >
          <span style={{ width: `${levelPct}%` }} />
        </div>
        <small className="profile-muted">Provisional participation levels — not a health status.</small>
      </div>
      {preview.daysCounted === 0 && (
        <p className="profile-muted" role="status">
          No XP yet — XP comes only from completed Tracker check-ins, never from visits or logins.
        </p>
      )}
    </div>
  );
}
