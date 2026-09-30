/**
 * Server-side Google auth bridge (shared helpers).
 *
 * Situation: the legacy identity backend (`LEGACY_AUTH_BASE_URL`) has no
 * Google route, and it is not in this repository. Until it gains one, these
 * same-origin routes verify the GIS credential with Google (via
 * google-auth-library, server-side only) and then talk to the legacy
 * email/password endpoints on the user's behalf.
 *
 * Bridge password design (interim, documented honestly):
 *   password = "ggl_" + HMAC_SHA256(GOOGLE_BRIDGE_SECRET, "google:<sub>")
 * - The secret never leaves the server (plain env var, no NEXT_PUBLIC_).
 * - The client never sees the password; it travels only server → backend.
 * - 256-bit derived entropy: uncrackable if the legacy password DB leaks,
 *   and uncomputable offline without the secret.
 * - Stable per Google account, so repeat Google logins just work.
 * - Consequence: Google-created accounts cannot log in via the email form
 *   (they never knew a password). The 409 `email_exists` path below handles
 *   the reverse case (email account exists, Google attempted).
 *
 * Nothing here is imported by client code — see contracts/api-v1.md boundary.
 */

import { OAuth2Client } from "google-auth-library";
import { createHmac } from "node:crypto";

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "";

const BRIDGE_SECRET = process.env.GOOGLE_BRIDGE_SECRET || "";

const LEGACY_BASE =
  process.env.LEGACY_AUTH_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://sih24-backend.onrender.com";

const LEGACY_AUTH = `${LEGACY_BASE.replace(/\/$/, "")}/api/auth`;

export function bridgeConfigured() {
  return Boolean(GOOGLE_CLIENT_ID && BRIDGE_SECRET);
}

/** Verify the GIS credential with Google. Returns the ID-token payload. */
export async function verifyGoogleCredential(credential) {
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

/** Deterministic, high-entropy bridge password for a Google subject. */
export function bridgePassword(sub) {
  return (
    "ggl_" +
    createHmac("sha256", BRIDGE_SECRET).update(`google:${sub}`).digest("hex")
  );
}

/** POST JSON to the legacy backend with a timeout. Never throws. */
export async function legacyPost(path, body) {
  try {
    const res = await fetch(`${LEGACY_AUTH}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 503, data: null };
  }
}

/** Accept the token shapes the legacy backend is known to return. */
export function extractLegacyToken(data) {
  if (!data || typeof data !== "object") return "";
  return (
    data.token ||
    data.authtoken ||
    data.accessToken ||
    data.jwt ||
    data?.data?.token ||
    ""
  );
}

/**
 * The legacy backend reports errors under `msg` (e.g. {"msg":" page not
 * found"}, {"msg":"Registered Sucessfully"}), not `message`. Read every
 * known shape so users see the true reason instead of a generic fallback.
 */
export function legacyMessage(data, fallback) {
  if (!data || typeof data !== "object") return fallback;
  const msg =
    data.message || data?.error?.message || data?.error || data.msg || "";
  return String(msg || "").trim() || fallback;
}

export function looksLikeDuplicate(data, status) {
  if (status === 409) return true;
  const msg = legacyMessage(data, "").toLowerCase();
  return /already|exists|duplicate|taken|registered/.test(msg);
}
