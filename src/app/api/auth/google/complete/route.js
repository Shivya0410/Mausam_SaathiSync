import { NextResponse } from "next/server";
import {
  bridgeConfigured,
  bridgePassword,
  extractLegacyToken,
  legacyMessage,
  legacyPost,
  looksLikeDuplicate,
  verifyGoogleCredential,
} from "../bridge";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store, private" };

/**
 * POST /api/auth/google/complete { credential, profile }
 *
 * Second step for new Google users: re-verifies the GIS credential (never
 * trusts the profile email on its own), then registers the user on the
 * legacy backend with the derived bridge password.
 *
 * Success → { token }. Email already registered → 409 `email_exists`.
 */
export async function POST(req) {
  let body = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 422, headers: noStore });
  }

  const credential = body?.credential || body?.idToken;
  const profile = body?.profile || {};
  if (!credential) {
    return NextResponse.json({ message: "Missing Google credential." }, { status: 422, headers: noStore });
  }
  if (!profile.firstName || !profile.lastName || !profile.age || !profile.gender) {
    return NextResponse.json(
      { message: "First name, last name, age and gender are required." },
      { status: 422, headers: noStore }
    );
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
  if (profile.email && String(profile.email).toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json(
      { message: "Profile email does not match the verified Google account." },
      { status: 422, headers: noStore }
    );
  }

  const complications = Array.isArray(profile.medicalComplications)
    ? profile.medicalComplications
    : String(profile.medicalComplications || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  const password = bridgePassword(sub);

  // Recovery first: the account may already exist — either Google-created on
  // an earlier attempt whose token never reached the browser, or a plain
  // retry. Logging in with the derived password succeeds in that case and
  // the user is done with no second registration.
  const login = await legacyPost("/login", { email, password });
  if (login.ok) {
    const existingToken = extractLegacyToken(login.data);
    if (existingToken) return NextResponse.json({ token: existingToken }, { headers: noStore });
  }

  const reg = await legacyPost("/register", {
    firstName: profile.firstName,
    middleName: profile.middleName || "",
    lastName: profile.lastName,
    email,
    age: Number(profile.age),
    medicalComplications: complications,
    gender: profile.gender,
    password,
  });

  if (reg.ok) {
    const token = extractLegacyToken(reg.data);
    if (token) return NextResponse.json({ token }, { headers: noStore });
  }
  if (looksLikeDuplicate(reg.data, reg.status)) {
    return NextResponse.json(
      {
        code: "email_exists",
        message: "This email is already registered. Log in with your password instead.",
      },
      { status: 409, headers: noStore }
    );
  }
  if (reg.status === 503) {
    return NextResponse.json(
      { message: "Account service is unreachable. Please try again in a moment." },
      { status: 503, headers: noStore }
    );
  }
  return NextResponse.json(
    { message: legacyMessage(reg.data, "Registration failed. Please try again.") },
    { status: 502, headers: noStore }
  );
}
