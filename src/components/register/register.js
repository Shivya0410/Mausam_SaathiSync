"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { registerUser } from "../../services/api";
import { useAuth } from "../../store/auth";
import { resolvePostAuthDestination } from "../../services/onboarding";
import { takePendingGoogleProfile } from "../../services/googleAuth";
import GoogleAuthButton from "../auth/GoogleAuthButton";
import GoogleProfileForm from "../auth/GoogleProfileForm";
import styles from "../auth/AuthForm.module.css";

const Register = () => {
  const { t } = useTranslation(); // Initialize translation hook
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    age: "",
    gender: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  // Set when Google verified a NEW user: show the required-inputs form
  // instead of the email form. May also arrive via login/home handoff.
  const [googlePending, setGooglePending] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const { storetokenInLS } = useAuth();

  // Consumes a one-time hand-off from sessionStorage (an external store),
  // so it must run once after mount rather than during render.
  useEffect(() => {
    const handed = takePendingGoogleProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (handed) setGooglePending(handed);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Health details are never collected (DPDP data minimisation, PRD 15.5);
      // the legacy backend still expects the field, so it is sent empty.
      const data = { ...formData, medicalComplications: [] };
      // registerUser stores the token and routes to /login; on success we
      // take the user through the fitness snapshot (onboarding) instead.
      const response = await registerUser(data, { push: () => {} }, storetokenInLS);

      // response.ok in the API layer already stored the JWT; anything without
      // an error flag is a success → continue to the fitness snapshot.
      if (response?.error) {
        setMessage(response.message || response.error);
      } else {
        router.push(resolvePostAuthDestination(next));
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setMessage(t("register.errorMessage"));
    }
  };

  const handleGoogleSuccess = async (appToken) => {
    // Known Google user: backend returned the app JWT straight away.
    storetokenInLS(appToken);
    router.push(resolvePostAuthDestination(next));
  };

  const handleGoogleNeedsProfile = async (pending) => {
    // New Google user: collect the required inputs, then finish signup.
    setGooglePending(pending);
    setMessage("");
  };

  const handleGoogleProfileDone = async (appToken) => {
    storetokenInLS(appToken);
    router.push(resolvePostAuthDestination(next));
  };

  const handleGoogleError = (message) => {
    setMessage(message || t("google.failed"));
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>
        {googlePending ? t("google.completeTitle") : t("register.heading")}
      </h2>
      {googlePending ? (
        <GoogleProfileForm
          pending={googlePending}
          onSuccess={handleGoogleProfileDone}
          onError={handleGoogleError}
          onBack={() => setGooglePending(null)}
        />
      ) : (
      <>
      <div className={styles.form} style={{ marginBottom: 14 }}>
        <GoogleAuthButton
          mode="signup"
          variant="card"
          onSuccess={handleGoogleSuccess}
          onNeedsProfile={handleGoogleNeedsProfile}
          onError={handleGoogleError}
        />
        <div className={styles.divider} aria-hidden="true">
          or
        </div>
      </div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          name="firstName"
          className={styles.input}
          placeholder={t("register.firstNamePlaceholder")}
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="middleName"
          className={styles.input}
          placeholder={t("register.middleNamePlaceholder")}
          value={formData.middleName}
          onChange={handleChange}
        />
        <input
          type="text"
          name="lastName"
          className={styles.input}
          placeholder={t("register.lastNamePlaceholder")}
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          className={styles.input}
          placeholder={t("register.emailPlaceholder")}
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="age"
          className={styles.input}
          placeholder={t("register.agePlaceholder")}
          value={formData.age}
          onChange={handleChange}
          required
        />
        <select
          name="gender"
          className={styles.input}
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="">{t("register.genderPlaceholder")}</option>
          <option value="Male">{t("register.genderOptions.male")}</option>
          <option value="Female">{t("register.genderOptions.female")}</option>
          <option value="Other">{t("register.genderOptions.other")}</option>
        </select>
        <input
          type="password"
          name="password"
          className={styles.input}
          placeholder={t("register.passwordPlaceholder")}
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button className={styles.button} type="submit">
          {t("register.buttonText")}
        </button>
      </form>
      </>
      )}
      {message && <p className={styles.message}>{typeof message === "string" ? message : JSON.stringify(message)}</p>}
    </div>
  );
};

export default Register;
