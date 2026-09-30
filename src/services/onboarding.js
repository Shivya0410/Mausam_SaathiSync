// First-run setup storage (PRD section 5.10).
//
// Everything here stays in this browser's localStorage and is never sent to
// a server. Part 2 rewrites the onboarding flow and adds the persona, place
// and household stores; this module only records whether setup is done.

const KEY = "mausam.onboarding.v1";

export const ONBOARDING_VERSION = 1;

export function getOnboarding() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

export function hasOnboarding() {
  return !!getOnboarding()?.completedAt;
}

export function saveOnboarding(answers = {}) {
  const payload = {
    version: ONBOARDING_VERSION,
    ...answers,
    completedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Storage blocked: the app still works, it just asks again next visit.
  }
  return payload;
}

export function clearOnboarding() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing stored.
  }
}

// Where to send the user right after a successful sign-in.
export function resolvePostAuthDestination(next) {
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (hasOnboarding()) return safeNext;
  return `/onboarding?next=${encodeURIComponent(safeNext)}`;
}
