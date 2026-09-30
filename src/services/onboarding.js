// Post-auth fitness questionnaire storage.
//
// IMPORTANT: answers (weight, height, age, …) are stored ONLY in this
// browser's localStorage. The /api/v1 preferences endpoint deliberately
// rejects body measurements and medical data (see
// src/server/domains/preferences.js), so nothing here is ever sent to a
// server. Values are wellness inputs, not medical data.

const KEY = "swasth.onboarding.v1";

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

export function saveOnboarding(answers) {
  const payload = {
    version: ONBOARDING_VERSION,
    ...answers,
    completedAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY, JSON.stringify(payload));
  return payload;
}

export function clearOnboarding() {
  localStorage.removeItem(KEY);
}

// Where to send the user right after a successful sign-in.
export function resolvePostAuthDestination(next) {
  const safeNext = next && next.startsWith("/") ? next : "/";
  if (hasOnboarding()) return safeNext;
  return `/onboarding?next=${encodeURIComponent(safeNext)}`;
}

export function bmiOf(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm);
  if (!w || !h || h <= 0) return null;
  const bmi = w / ((h / 100) * (h / 100));
  return Math.round(bmi * 10) / 10;
}
