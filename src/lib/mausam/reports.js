// Crowd report helpers shared by rules, widgets and pages (PRD 9.7, 11.2).
// Pure.

export const SEVERITIES = [1, 2, 3, 4];
export const REPORT_RADIUS_KM = 10;

/**
 * Whether a report is trusted enough to appear in decision cards: AI or
 * community verified, or unverified with at least one human confirmation.
 */
export function isTrusted(r) {
  if (!r || r.status === 'cleared') return false;
  if (r.status === 'ai_verified' || r.status === 'community_verified') return true;
  return r.status === 'unverified' && (r.confirmations || 0) >= 1;
}

/** Active (not cleared, not expired) at `now`. */
export function isActive(r, now) {
  return Boolean(r) && r.status !== 'cleared' && (!r.expiresAt || Date.parse(r.expiresAt) > now);
}

export function minutesAgo(r, now) {
  return Math.max(0, Math.round((now - Date.parse(r.observedAt)) / 60000));
}

/** Near-me list: active reports sorted by distance then recency. */
export function sortNearMe(reports, now) {
  return reports
    .filter((r) => isActive(r, now))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0) || Date.parse(b.observedAt) - Date.parse(a.observedAt));
}
