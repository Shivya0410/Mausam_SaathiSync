import { AUTH_API_URL } from "./config";

const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// Upper bound for the GIS script + first render. Without this a stalled
// network (or a silent blocker) leaves the UI on "Loading Google sign-in…"
// forever. On timeout the caller falls back to email login with retry.
export const GSI_LOAD_TIMEOUT_MS = 12000;

let gsiLoadPromise = null;

/**
 * Client ID for Google Identity Services. Must be a Web-type OAuth client ID
 * from Google Cloud Console > APIs & Services > Credentials.
 * The current origin (e.g. http://localhost:3000) must be an authorised
 * JavaScript origin on that client, otherwise GIS throws origin_mismatch.
 */
export const getGoogleClientId = () =>
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

/**
 * Load the Google Identity Services script exactly once. Resolves with the
 * global `google` object. Rejects when blocked (ad-blocker, tracking
 * protection, offline) so callers can show the email fallback.
 */
export function loadGsiScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in needs a browser window."));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google);
  }
  if (gsiLoadPromise) return gsiLoadPromise;

  gsiLoadPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      gsiLoadPromise = null;
      reject(
        new Error(
          "Google sign-in timed out while loading. Check your connection or ad-blocker, then retry — or use email login."
        )
      );
    }, GSI_LOAD_TIMEOUT_MS);

    const done = (fn) => (value) => {
      clearTimeout(timer);
      fn(value);
    };

    const existing = document.querySelector(`script[src="${GSI_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.google?.accounts?.id) done(resolve)(window.google);
        else done(reject)(new Error("Google script loaded but accounts.id is missing."));
      });
      existing.addEventListener("error", () =>
        done(reject)(new Error("Google script failed to load."))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) done(resolve)(window.google);
      else done(reject)(new Error("Google script loaded but accounts.id is missing."));
    };
    script.onerror = () => done(reject)(new Error("Google script failed to load."));
    document.head.appendChild(script);
  });

  // Allow a retry after a failure (e.g. ad-blocker disabled).
  gsiLoadPromise.catch(() => {
    gsiLoadPromise = null;
  });

  return gsiLoadPromise;
}

/**
 * Decode the GIS credential payload WITHOUT verifying it. The result is used
 * only for UI: prefilling the profile form and showing "Continue as X".
 * It is never trusted for identity — only the backend's verification counts.
 * Returns { name, given_name, family_name, email, picture } or null.
 */
export function decodeGoogleCredential(credential) {
  try {
    const parts = String(credential || "").split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return {
      name: payload.name || "",
      given_name: payload.given_name || "",
      family_name: payload.family_name || "",
      email: payload.email || "",
      picture: payload.picture || "",
    };
  } catch {
    return null;
  }
}

/** Pull the app JWT out of the backend's success body (several shapes). */
function extractAppToken(data) {
  return (
    data?.token ||
    data?.authtoken ||
    data?.accessToken ||
    data?.jwt ||
    data?.data?.token ||
    ""
  );
}

/** True when the backend verified Google but needs the profile form first. */
function extractNeedsProfile(data) {
  if (!data || typeof data !== "object") return null;
  const flagged =
    data.needsProfile === true ||
    data.profileRequired === true ||
    data.code === "profile_required" ||
    data?.error?.code === "profile_required";
  if (!flagged) return null;
  return {
    needsProfile: true,
    profileToken: data.profileToken || data.ticket || data.token || "",
    suggested: data.suggested || data.prefill || {},
  };
}
export async function exchangeGoogleCredentialForAppToken(credential) {
  if (!credential) throw new Error("Missing Google credential.");

  // Same-origin bridge first: it verifies with Google server-side and talks
  // to the legacy backend, so Google login works even though the legacy
  // backend has no native Google route. Legacy native paths are the fallback
  // for the day the backend gains one.
  const urls = [
    "/api/auth/google",
    `${AUTH_API_URL}/google`,
    `${AUTH_API_URL}/google-login`,
    `${AUTH_API_URL}/google-auth`,
  ];
  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential, idToken: credential }),
      });

      // 404 = no Google route at this URL — try the next candidate.
      if (response.status === 404) {
        lastError = new Error(
          `Backend has no POST ${url} route yet (HTTP 404).`
        );
        continue;
      }

      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        // 422/409 with a profile_required code means: Google is verified,
        // the account is new — collect the profile form, then complete.
        const needs = extractNeedsProfile(data);
        if (needs) return { token: "", ...needs, raw: data };
        throw new Error(
          data?.message || data?.error?.message || `Google login failed (HTTP ${response.status}).`
        );
      }

      // Some backends answer 200 + { needsProfile: true } for new users.
      const needs = extractNeedsProfile(data);
      if (needs) return { token: "", ...needs, raw: data };

      const token = extractAppToken(data);

      if (!token) {
        throw new Error(
          "Backend verified Google but returned no app token. Expected { token }."
        );
      }

      return { token, raw: data };
    } catch (err) {
      lastError = err;
      // Network error: no point trying further candidates.
      if (err instanceof TypeError) break;
      // For the last candidate, fall through to the throw below.
      if (url === urls[urls.length - 1]) break;
      // If the error is not a 404-missing-route, stop trying candidates.
      if (!/no POST .* route yet/.test(err.message)) break;
    }
  }

  throw lastError || new Error("Google login failed.");
}

/**
 * Second step for new Google users: send the verified credential (plus the
 * backend's one-time profileToken when provided) together with the required
 * profile inputs. Returns the app JWT on success.
 *
 *   POST {AUTH_API_URL}/google/complete
 *   Body: { credential, profileToken, profile: { firstName, lastName, age,
 *           gender, medicalComplications[] } }
 *   Success: { "token": "<app jwt>" }
 */
export async function completeGoogleProfile({ credential, profileToken, profile }) {
  if (!credential) throw new Error("Missing Google credential.");
  if (!profile?.firstName || !profile?.lastName || !profile?.age || !profile?.gender) {
    throw new Error("First name, last name, age and gender are required.");
  }

  const paths = ["/api/auth/google/complete", "/api/auth/google", `${AUTH_API_URL}/google`];
  let lastError = null;

  const body = {
    credential,
    idToken: credential,
    profileToken: profileToken || undefined,
    profile: {
      firstName: profile.firstName,
      middleName: profile.middleName || "",
      lastName: profile.lastName,
      email: profile.email || undefined,
      age: Number(profile.age),
      gender: profile.gender,
      medicalComplications: Array.isArray(profile.medicalComplications)
        ? profile.medicalComplications
        : String(profile.medicalComplications || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
    },
  };

  for (const url of paths) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 404) {
        lastError = new Error(`Backend has no POST ${url} route yet (HTTP 404).`);
        continue;
      }
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      if (!response.ok) {
        throw new Error(
          data?.message || data?.error?.message || `Profile completion failed (HTTP ${response.status}).`
        );
      }
      const token = extractAppToken(data);
      if (!token) throw new Error("Backend accepted the profile but returned no app token.");
      return { token, raw: data };
    } catch (err) {
      lastError = err;
      if (err instanceof TypeError) break;
      if (url === paths[paths.length - 1]) break;
      if (!/no POST .* route yet/.test(err.message)) break;
    }
  }

  throw lastError || new Error("Profile completion failed.");
}

const REMEMBER_KEY = "swasth.google.account";
const PENDING_KEY = "swasth.google.pending";

/**
 * Remembered Google account (display hint only: name/email/picture).
 * This is NOT a session — the session is always the backend JWT in `token`.
 * Kept across logout so the next visit can offer "Continue as X" + one-click
 * GIS login with the same account.
 */
export function getRememberedGoogleAccount() {
  try {
    const raw = localStorage.getItem(REMEMBER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

export function saveRememberedGoogleAccount(account) {
  try {
    if (!account?.email) return;
    localStorage.setItem(
      REMEMBER_KEY,
      JSON.stringify({
        name: account.name || "",
        email: account.email,
        picture: account.picture || "",
        at: new Date().toISOString(),
      })
    );
  } catch {
    /* storage unavailable — hint simply won't show */
  }
}

export function clearRememberedGoogleAccount() {
  try {
    localStorage.removeItem(REMEMBER_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Cross-page handoff for the profile step: login/home stash the verified
 * credential here and route to /register, which picks it up and renders the
 * profile form instead of making the user click Google a second time.
 */
export function stashPendingGoogleProfile(pending) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    /* ignore */
  }
}

export function takePendingGoogleProfile() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.credential ? parsed : null;
  } catch {
    return null;
  }
}
