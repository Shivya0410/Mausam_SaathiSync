"use client";

import React, { useMemo } from "react";
import Link from "next/link";

/**
 * Continue Your Journey: one contextual next step derived ONLY from actual
 * local activity (qualifying Tracker check-ins). Nothing is invented: no
 * assumed streak, no assumed unfinished goal, no assumed challenge state.
 * Every state links to an existing route.
 */
export default function ContinueJourney({ summary }) {
  const step = useMemo(() => {
    const active = summary?.activeDays || 0;
    if (active === 0) {
      return {
        title: "Log your first check-in",
        body: "Your journey starts with one completed activity — Yoga, Meditation, Diet, or Creative Hub in the Tracker.",
        href: "/tracker",
        cta: "Open Tracker →",
      };
    }
    if ((summary?.currentStreak || 0) >= 1) {
      return {
        title: `Keep your ${summary.currentStreak}-day streak alive`,
        body: `You have ${active} active day${active === 1 ? "" : "s"} logged in this browser. Log today's pillars to extend the run.`,
        href: "/tracker",
        cta: "Log today →",
      };
    }
    if ((summary?.perfectDays || 0) === 0) {
      return {
        title: "Aim for your first 4/4 day",
        body: `Best so far: ${summary.bestDay || "—"} (${summary.bestScore || 0}/4). Completing all four pillars unlocks the Perfect Day badge.`,
        href: "/tracker",
        cta: "Open Tracker →",
      };
    }
    return {
      title: "Take the consistency further",
      body: `${summary.perfectDays} perfect day${summary.perfectDays === 1 ? "" : "s"} logged. Join a community challenge to build on the habit.`,
      href: "/challenges",
      cta: "Browse Challenges →",
    };
  }, [summary]);

  return (
    <div className="profile-journey" role="status" aria-label="Continue your journey">
      <p>
        <strong>{step.title}</strong>
      </p>
      <p className="profile-muted">{step.body}</p>
      <p>
        <Link href={step.href}>{step.cta}</Link>
      </p>
    </div>
  );
}
