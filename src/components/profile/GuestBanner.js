"use client";

import Link from "next/link";

/**
 * Guest-mode notice: profile works without login/Google, data stays local.
 */
export default function GuestBanner() {
  return (
    <div
      className="profile-guest-banner"
      role="note"
      aria-label="Guest mode notice"
    >
      <div>
        <strong>Guest mode — no login needed.</strong>
        <span>
          {" "}
          Your activity, goals, and XP preview are saved only in this browser
          under a guest profile. They are not synced and never leave this
          device.
        </span>
      </div>
      <div className="profile-guest-actions">
        <Link href="/login" className="profile-guest-login">
          Log in to sync
        </Link>
        <Link href="/tracker" className="profile-guest-track">
          Log activity in Tracker →
        </Link>
      </div>
    </div>
  );
}
