import { NextResponse } from "next/server";
import {
  bridgeConfigured,
  bridgePassword,
  extractLegacyToken,
  legacyPost,
  verifyGoogleCredential,
} from "./bridge";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, private" };

/**
 * POST /api/auth/google { credential }
 *
 * 1. Verifies the GIS credential with Google (server-side).
 * 2. Tries a legacy email/password login with the derived bridge password.
 *    - Known Google user  → { token } (legacy backend JWT, same as email login)
 *    - Unknown user       → { needsProfile: true, suggested } (client shows
 *      the profile form, then calls /api/auth/google/complete)
 */
export async function POST(req) {
  let body = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 422, headers: noStore });
  }

  const credential = body?.credential || body?.idToken;
  if (!credential) {
    return NextResponse.json({ message: "Missing Google credential." }, { status: 422, headers: noStore });
  }
  if (!bridgeConfigured()) {
    return NextResponse.json(
      { message: "Google login is not configured on the server." },
      { status: 503, headers: noStore }
    );
  }

  let payload = null;
  try {
    payload = await verifyGoogleCredential(credential);
  } catch {
    return NextResponse.json(
      { message: "Google verification failed. Please try again." },
      { status: 401, headers: noStore }
    );
  }

  const email = payload?.email || "";
  const sub = payload?.sub || "";
  if (!payload?.email_verified || !email || !sub) {
    return NextResponse.json(
      { message: "This Google account has no verified email." },
      { status: 401, headers: noStore }
    );
  }

  const login = await legacyPost("/login", { email, password: bridgePassword(sub) });
  if (login.ok) {
    const token = extractLegacyToken(login.data);
    if (token) return NextResponse.json({ token }, { headers: noStore });
  }

  return NextResponse.json(
    {
      needsProfile: true,
      suggested: {
        firstName: payload.given_name || "",
        lastName: payload.family_name || "",
        email,
      },
    },
    { headers: noStore }
  );
}
