"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { completeGoogleProfile } from "../../services/googleAuth";
import styles from "./AuthForm.module.css";

/**
 * Step 2 of Google signup: Google has verified the identity, now collect the
 * app's required profile inputs (same fields as email registration, minus the
 * password). Name/email arrive prefilled from the verified Google profile.
 *
 * Props:
 *   pending: { credential, profileToken, suggested, account }
 *   onSuccess(appToken), onError(message), onBack()
 */
export default function GoogleProfileForm({ pending, onSuccess, onError, onBack }) {
  const { t } = useTranslation();
  const account = pending?.account || {};
  const suggested = pending?.suggested || {};

  const splitName = (name) => {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    return { first: parts[0] || "", last: parts.slice(1).join(" ") || "" };
  };
  const fromAccount = splitName(account.name || account.given_name || "");

  const [form, setForm] = useState({
    firstName: suggested.firstName || account.given_name || fromAccount.first,
    middleName: suggested.middleName || "",
    lastName: suggested.lastName || account.family_name || fromAccount.last,
    email: suggested.email || account.email || "",
    age: suggested.age || "",
    medicalComplications: Array.isArray(suggested.medicalComplications)
      ? suggested.medicalComplications.join(", ")
      : suggested.medicalComplications || "",
    gender: suggested.gender || "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token } = await completeGoogleProfile({
        credential: pending?.credential,
        profileToken: pending?.profileToken,
        profile: form,
      });
      setBusy(false);
      if (onSuccess) await onSuccess(token);
    } catch (err) {
      setBusy(false);
      const msg = err?.message || t("google.failed");
      setError(msg);
      if (onError) onError(msg);
    }
  };

  return (
    <div className={styles.form}>
      <p className={styles.accountHint} role="note">
        {account.picture ? (
          <img src={account.picture} alt="" width={22} height={22} referrerPolicy="no-referrer" />
        ) : (
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
        )}
        <span>{t("google.completeSub", { email: account.email || form.email || "…" })}</span>
      </p>
      <form onSubmit={handleSubmit} style={{ display: "contents" }}>
        <input
          type="text"
          name="firstName"
          className={styles.input}
          placeholder={t("register.firstNamePlaceholder")}
          value={form.firstName}
          onChange={handleChange}
          autoComplete="given-name"
          required
        />
        <input
          type="text"
          name="middleName"
          className={styles.input}
          placeholder={t("register.middleNamePlaceholder")}
          value={form.middleName}
          onChange={handleChange}
          autoComplete="additional-name"
        />
        <input
          type="text"
          name="lastName"
          className={styles.input}
          placeholder={t("register.lastNamePlaceholder")}
          value={form.lastName}
          onChange={handleChange}
          autoComplete="family-name"
          required
        />
        <input
          type="email"
          name="email"
          className={styles.input}
          placeholder={t("register.emailPlaceholder")}
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          readOnly
          title={t("google.completeSub", { email: account.email || "" })}
        />
        <input
          type="number"
          name="age"
          className={styles.input}
          placeholder={t("register.agePlaceholder")}
          value={form.age}
          onChange={handleChange}
          min={1}
          max={130}
          required
        />
        <input
          type="text"
          name="medicalComplications"
          className={styles.input}
          placeholder={t("register.medicalComplicationsPlaceholder")}
          value={form.medicalComplications}
          onChange={handleChange}
        />
        <select
          name="gender"
          className={styles.input}
          value={form.gender}
          onChange={handleChange}
          required
        >
          <option value="">{t("register.genderPlaceholder")}</option>
          <option value="Male">{t("register.genderOptions.male")}</option>
          <option value="Female">{t("register.genderOptions.female")}</option>
          <option value="Other">{t("register.genderOptions.other")}</option>
        </select>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button className={styles.button} type="submit" disabled={busy}>
          {busy ? t("google.completing") : t("google.finishBtn")}
        </button>
        {onBack && (
          <button
            type="button"
            className={styles.retryBtn}
            onClick={onBack}
            disabled={busy}
            style={{ alignSelf: "center" }}
          >
            {t("google.backToOptions")}
          </button>
        )}
      </form>
    </div>
  );
}
