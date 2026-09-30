// Browser-local menstrual cycle log for the SheFit demo build - no login,
// no server round-trip. Mirrors the shape and derived-stat logic of
// src/server/domains/cycleLogs.js (getCycleSummary) so the UI behaves the
// same way it would against the authenticated API, but everything here
// lives in localStorage on the visitor's own device.
//
// Namespaced per signed-in identity (see utils/userScopedStorage): two
// accounts on one browser no longer share cycle logs. The old global key is
// read once as a migration source and then abandoned.

import { saveForUser, userKey } from "./userScopedStorage";

const STORAGE_KEY = "shefit.cycleEntries.v1";
const LEGACY_KEY = "shefit.cycleEntries.v1";

function namespaced(user) {
  // userScopedStorage keys as `${BASE}::${identity}`; the legacy global key
  // is exactly STORAGE_KEY with no suffix.
  try {
    return userKey(STORAGE_KEY, user);
  } catch {
    return STORAGE_KEY;
  }
}

function readRaw(user) {
  if (typeof window === "undefined") return [];
  try {
    let raw = window.localStorage.getItem(namespaced(user));
    if (!raw) {
      // One-time migration from the pre-login global key.
      raw = window.localStorage.getItem(LEGACY_KEY);
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(entries, user) {
  if (typeof window === "undefined") return;
  try {
    saveForUser(STORAGE_KEY, user, entries);
  } catch {
    // Storage unavailable (private mode, quota, etc.) - fail silently, the
    // demo simply won't persist across a refresh in that case.
  }
}

function makeId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Appends a new cycle entry and returns it, same shape as the server's
 * logCycle() response.
 */
export function addLocalCycleEntry({ startDate, endDate, symptoms, note }, user) {
  const entries = readRaw(user);
  const entry = {
    id: makeId(),
    startDate,
    endDate: endDate || null,
    symptoms: symptoms ?? [],
    note: note || "",
    createdAt: new Date().toISOString(),
  };
  writeRaw([...entries, entry], user);
  return entry;
}

/**
 * The same { entries, cycleCount, averageCycleLengthDays } shape as
 * getCycleSummary() on the server, computed locally instead.
 */
export function getLocalCycleSummary(user) {
  const entries = readRaw(user).sort((a, b) =>
    a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0
  );

  let averageCycleLengthDays = null;
  if (entries.length >= 2) {
    const gaps = [];
    for (let i = 1; i < entries.length; i += 1) {
      const previous = new Date(`${entries[i - 1].startDate}T00:00:00Z`);
      const current = new Date(`${entries[i].startDate}T00:00:00Z`);
      const days = Math.round((current - previous) / (1000 * 60 * 60 * 24));
      if (days > 0) gaps.push(days);
    }
    if (gaps.length > 0) {
      averageCycleLengthDays = Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length);
    }
  }

  return {
    entries,
    cycleCount: entries.length,
    averageCycleLengthDays,
  };
}
