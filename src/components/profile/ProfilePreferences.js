"use client";

import React, { useCallback, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { saveForUser, userKey } from "../../utils/userScopedStorage";
import {
  getProfilePrefsServerSnapshot,
  getProfilePrefsSnapshot,
  notifyProfilePrefsChanged,
  subscribeToProfilePrefsStore,
} from "../../lib/profilePrefsStore";

export const PROFILE_PREFS_KEY = "swasth.profilePrefs.v1";

const GOALS = ["strength", "stamina", "flexibility", "healthy-weight", "calm"];
const EXPERIENCE = ["beginner", "some", "regular"];
const SESSION_LENGTHS = ["15", "20", "30", "45"];
const LANGUAGES = ["en", "hi"];

/**
 * Profile preferences. All fields are browser-only under this account's
 * namespace and are labelled as such — they are NOT synced to any server.
 *
 * The existing PATCH /api/v1/me/preferences contract supports only
 * locale/timezone/reducedMotion/largeText, so wellness goal, experience,
 * session length, and coarse location cannot be sent there without changing
 * the backend contract (out of scope for this pass). Language applies
 * immediately in the app when changed. Coarse city/state are free text you
 * type yourself — no GPS or precise location is ever collected.
 */
export default function ProfilePreferences({ user }) {
  const { i18n } = useTranslation();
  const storageKey = userKey(PROFILE_PREFS_KEY, user);
  // Snapshots are cached per key (see src/lib/profilePrefsStore.js): returning
  // a fresh object on every getSnapshot/getServerSnapshot call makes React loop
  // ("getSnapshot should be cached" -> "Maximum update depth exceeded").
  const getSnapshot = useCallback(() => getProfilePrefsSnapshot(storageKey), [storageKey]);
  const prefs = useSyncExternalStore(
    subscribeToProfilePrefsStore,
    getSnapshot,
    getProfilePrefsServerSnapshot
  );
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const draft = form || prefs;

  const set = (field, value) => {
    setForm({ ...draft, [field]: value });
    setSaved(false);
  };

  const save = (e) => {
    e.preventDefault();
    setError("");
    if (draft.goal && !GOALS.includes(draft.goal)) {
      setError("Choose a valid wellness goal.");
      return;
    }
    if (draft.experience && !EXPERIENCE.includes(draft.experience)) {
      setError("Choose a valid yoga experience level.");
      return;
    }
    if (draft.sessionLength && !SESSION_LENGTHS.includes(draft.sessionLength)) {
      setError("Choose a valid session length.");
      return;
    }
    if (draft.language && !LANGUAGES.includes(draft.language)) {
      setError("Choose a supported language.");
      return;
    }
    for (const field of ["city", "state"]) {
      const v = String(draft[field] || "");
      if (v.length > 60) {
        setError("City and state must be 60 characters or fewer (coarse location only).");
        return;
      }
    }
    const next = {
      goal: draft.goal || "",
      experience: draft.experience || "",
      sessionLength: draft.sessionLength || "",
      language: draft.language || "",
      city: String(draft.city || "").trim(),
      state: String(draft.state || "").trim(),
      updatedAt: new Date().toISOString(),
    };
    saveForUser(PROFILE_PREFS_KEY, user, next);
    notifyProfilePrefsChanged();
    setForm(null);
    setSaved(true);
    if (next.language && i18n && typeof i18n.changeLanguage === "function") {
      i18n.changeLanguage(next.language);
    }
  };

  const summarize = () => {
    const bits = [];
    if (prefs.goal) bits.push(`Goal: ${prefs.goal}`);
    if (prefs.experience) bits.push(`Yoga: ${prefs.experience}`);
    if (prefs.sessionLength) bits.push(`${prefs.sessionLength} min sessions`);
    if (prefs.city || prefs.state) bits.push(`Area: ${[prefs.city, prefs.state].filter(Boolean).join(", ")}`);
    return bits.length ? bits.join(" · ") : "No preferences set yet — everything here is optional.";
  };

  return (
    <div className="profile-goals">
      <p className="profile-local-note">Saved in this browser only · per account · not synced</p>
      <p className="profile-muted" role="status">
        {summarize()}
      </p>
      <form onSubmit={save} className="profile-goals-form" aria-label="Profile preferences">
        <label>
          Primary wellness goal
          <select value={draft.goal} onChange={(e) => set("goal", e.target.value)} aria-label="Primary wellness goal">
            <option value="">Not set</option>
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label>
          Yoga experience
          <select value={draft.experience} onChange={(e) => set("experience", e.target.value)} aria-label="Yoga experience">
            <option value="">Not set</option>
            {EXPERIENCE.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label>
          Preferred session length (min)
          <select
            value={draft.sessionLength}
            onChange={(e) => set("sessionLength", e.target.value)}
            aria-label="Preferred session length"
          >
            <option value="">Not set</option>
            {SESSION_LENGTHS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Language
          <select value={draft.language} onChange={(e) => set("language", e.target.value)} aria-label="Preferred language">
            <option value="">App default</option>
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
          </select>
        </label>
        <label>
          City (coarse, optional — no GPS)
          <input
            type="text"
            maxLength={60}
            value={draft.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="e.g. Delhi"
            aria-label="Coarse city, optional"
            autoComplete="off"
          />
        </label>
        <label>
          State (coarse, optional)
          <input
            type="text"
            maxLength={60}
            value={draft.state}
            onChange={(e) => set("state", e.target.value)}
            placeholder="e.g. Delhi"
            aria-label="Coarse state, optional"
            autoComplete="off"
          />
        </label>
        <button type="submit">Save preferences</button>
      </form>
      {error && (
        <p className="profile-form-error" role="alert">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="profile-muted" role="status">
          Saved in this browser. Language applies immediately when set.
        </p>
      )}
    </div>
  );
}
