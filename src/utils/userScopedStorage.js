"use client";

/**
 * Per-user browser storage.
 *
 * Problem it fixes: keys like `swasth.clappedPosts.v1` are device-global, so
 * two accounts on one browser share tracker data, badges, cycle logs, etc.
 * These helpers namespace every key by the signed-in identity (backend user
 * id/email, else the remembered Google account, else "guest"), so data is
 * "based on logins and profiles" as it should be.
 *
 * Usage:
 *   import { userKey, loadForUser, saveForUser } from "../utils/userScopedStorage";
 *   const k = userKey("tracker.monthly.v1", user); // user = auth context user
 */

function identityOf(user) {
  if (!user) {
    try {
      const g = JSON.parse(localStorage.getItem("swasth.google.account") || "null");
      if (g?.email) return `google:${String(g.email).toLowerCase()}`;
    } catch {
      /* ignore */
    }
    return "guest";
  }
  if (typeof user === "string") return `id:${user}`;
  const id = user._id || user.id || user.email || "";
  return id ? `id:${String(id).toLowerCase()}` : "guest";
}

export function userKey(baseKey, user) {
  return `${baseKey}::${identityOf(user)}`;
}

export function loadForUser(baseKey, user, fallback = null) {
  try {
    const raw = localStorage.getItem(userKey(baseKey, user));
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveForUser(baseKey, user, value) {
  try {
    localStorage.setItem(userKey(baseKey, user), JSON.stringify(value));
  } catch {
    /* storage full/unavailable — data simply won't persist */
  }
}
