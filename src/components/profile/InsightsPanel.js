"use client";

import React, { useMemo } from "react";
import Link from "next/link";

const PILLAR_NAMES = { Y: "Yoga", M: "Meditation", E: "Healthy Diet", C: "Creative Hub" };

/**
 * Personal insights derived ONLY from qualifying tracker check-ins.
 * No medical, cycle, or body-measurement data is used or inferred.
 * Every claim carries its denominator (logged days), and empty states
 * stay empty rather than inventing figures.
 */
export default function InsightsPanel({ summary, events }) {
  const insights = useMemo(() => {
    if (!summary || summary.activeDays === 0) return [];
    const out = [];
    const entries = Object.entries(summary.perPillar).sort((a, b) => b[1] - a[1]);
    const [topCode, topN] = entries[0];
    if (topN > 0) {
      out.push(`Top pillar: ${PILLAR_NAMES[topCode]} on ${topN} of ${summary.activeDays} logged days.`);
    }
    if (summary.bestDay) {
      out.push(`Best day: ${summary.bestDay} with ${summary.bestScore} of 4 pillars.`);
    }
    if (summary.currentStreak >= 2) {
      out.push(`Current streak: ${summary.currentStreak} active days in a row (longest ${summary.longestStreak}).`);
    } else if (summary.activeDays >= 2) {
      out.push(`Longest streak so far: ${summary.longestStreak} active days. Log today to start a new run.`);
    }
    if (summary.perfectDays > 0) {
      out.push(`${summary.perfectDays} perfect 4/4 day${summary.perfectDays === 1 ? "" : "s"} — consistency beats intensity.`);
    }
    return out.slice(0, 4);
  }, [summary]);

  const recent = useMemo(() => {
    const list = [...(events || [])].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
    return list;
  }, [events]);

  const total = summary?.totalChecks || 0;

  return (
    <div className="profile-insights">
      <div className="profile-dist" aria-label="Category distribution">
        {(["Y", "M", "E", "C"]).map((code) => {
          const n = summary?.perPillar?.[code] || 0;
          const pct = total ? Math.round((n / Math.max(1, summary.activeDays)) * 100) : 0;
          return (
            <div key={code} className="profile-dist-row">
              <span>{PILLAR_NAMES[code]}</span>
              <div className="profile-dist-bar" role="img" aria-label={`${PILLAR_NAMES[code]} on ${n} days`}>
                <span style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
              <strong>{n}d</strong>
            </div>
          );
        })}
      </div>
      {insights.length === 0 ? (
        <p className="profile-muted" role="status">
          Log at least one Tracker check-in to see insights. Nothing is inferred until you do.
        </p>
      ) : (
        <ul className="profile-insights-list">
          {insights.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <h4>Recent activity</h4>
      {recent.length === 0 ? (
        <p className="profile-muted">No recent check-ins yet.</p>
      ) : (
        <ul className="profile-recent-list">
          {recent.map((e, i) => (
            <li key={`${e.date}-${e.pillar}-${i}`}>
              <span>{e.date}</span> · <span>{PILLAR_NAMES[e.pillar]}</span> ·{" "}
              <Link href="/tracker">Open Tracker →</Link>
            </li>
          ))}
        </ul>
      )}
      <p className="profile-insights-nav">
        <Link href="/tracker">Log in Tracker →</Link> · <Link href="/challenges">Browse Challenges →</Link> ·{" "}
        <Link href="/leaderboard">View Leaderboard →</Link>
      </p>
    </div>
  );
}
