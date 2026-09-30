"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { bmiOf, getOnboarding, saveOnboarding } from "../../services/onboarding";
import styles from "./OnboardingQuiz.module.css";

const STEPS = ["basics", "lifestyle", "review"];

function Chip({ selected, onClick, icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${styles.chip} ${selected ? styles.chipOn : ""}`}
      aria-pressed={selected}
    >
      {icon && <i className={icon} aria-hidden="true"></i>}
      {children}
    </button>
  );
}

export default function OnboardingQuiz() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const ACTIVITY = [
    { id: "sedentary", icon: "fa-solid fa-couch", label: t("onboarding.sedentary") },
    { id: "light", icon: "fa-solid fa-person-walking", label: t("onboarding.light") },
    { id: "active", icon: "fa-solid fa-person-running", label: t("onboarding.active") },
    { id: "athlete", icon: "fa-solid fa-dumbbell", label: t("onboarding.athlete") },
  ];

  const GOALS = [
    { id: "strength", icon: "fa-solid fa-dumbbell", label: t("onboarding.strength") },
    { id: "stamina", icon: "fa-solid fa-heart-pulse", label: t("onboarding.stamina") },
    { id: "flexibility", icon: "fa-solid fa-person-praying", label: t("onboarding.flexibility") },
    { id: "weight", icon: "fa-solid fa-scale-balanced", label: t("onboarding.healthyWeight") },
    { id: "calm", icon: "fa-solid fa-brain", label: t("onboarding.calm") },
  ];

  const GENDERS = [
    { id: "Female", label: t("register.genderOptions.female") },
    { id: "Male", label: t("register.genderOptions.male") },
    { id: "Other", label: t("register.genderOptions.other") },
  ];

  const saved = useMemo(() => getOnboarding() || {}, []);
  const [step, setStep] = useState(0);
  const [weightKg, setWeightKg] = useState(saved.weightKg ?? "");
  const [heightCm, setHeightCm] = useState(saved.heightCm ?? "");
  const [age, setAge] = useState(saved.age ?? "");
  const [gender, setGender] = useState(saved.gender ?? "");
  const [activityLevel, setActivityLevel] = useState(saved.activityLevel ?? "");
  const [goal, setGoal] = useState(saved.goal ?? "");
  const [workoutDays, setWorkoutDays] = useState(saved.workoutDays ?? 3);
  const [sleepHours, setSleepHours] = useState(saved.sleepHours ?? 7);
  const [note, setNote] = useState(saved.note ?? "");
  const [error, setError] = useState("");

  const bmi = bmiOf(weightKg, heightCm);

  const validBasics =
    Number(weightKg) >= 20 &&
    Number(weightKg) <= 300 &&
    Number(heightCm) >= 50 &&
    Number(heightCm) <= 250 &&
    Number(age) >= 5 &&
    Number(age) <= 120 &&
    !!gender;

  const validLifestyle = !!activityLevel && !!goal;

  const canContinue = step === 0 ? validBasics : step === 1 ? validLifestyle : true;

  const goNext = () => {
    if (!canContinue) {
      setError(step === 0 ? t("onboarding.errBasics") : t("onboarding.errLifestyle"));
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const finish = (skip = false) => {
    if (!skip && step < STEPS.length - 1) {
      goNext();
      return;
    }
    saveOnboarding({ weightKg, heightCm, age, gender, activityLevel, goal, workoutDays, sleepHours, note });
    router.push(next.startsWith("/") ? next : "/");
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.head}>
          <div>
            <h1>{t("onboarding.title")}</h1>
            <p>{t("onboarding.subtitle")}</p>
          </div>
          <div className={styles.dots} aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s} className={`${styles.dot} ${i <= step ? styles.dotOn : ""}`} />
            ))}
          </div>
        </header>

        <div className={styles.progress} aria-hidden="true">
          <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>

        <div className={styles.cards}>
          {step === 0 && (
            <section className={styles.card} aria-label={t("onboarding.basics")}>
              <h2><i className="fa-solid fa-scale-balanced" aria-hidden="true"></i> {t("onboarding.basics")}</h2>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span>{t("onboarding.weight")}</span>
                  <input
                    className={styles.input} type="number" inputMode="decimal" min="20" max="300"
                    placeholder={t("onboarding.weightPh")} value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)} required
                  />
                </label>
                <label className={styles.field}>
                  <span>{t("onboarding.height")}</span>
                  <input
                    className={styles.input} type="number" inputMode="decimal" min="50" max="250"
                    placeholder={t("onboarding.heightPh")} value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)} required
                  />
                </label>
                <label className={styles.field}>
                  <span>{t("onboarding.age")}</span>
                  <input
                    className={styles.input} type="number" inputMode="numeric" min="5" max="120"
                    placeholder={t("onboarding.agePh")} value={age}
                    onChange={(e) => setAge(e.target.value)} required
                  />
                </label>
                <div className={styles.field}>
                  <span>{t("onboarding.gender")}</span>
                  <div className={styles.chips}>
                    {GENDERS.map((g) => (
                      <Chip key={g.id} selected={gender === g.id} onClick={() => setGender(g.id)}>{g.label}</Chip>
                    ))}
                  </div>
                </div>
              </div>
              {bmi && (
                <p className={styles.hint}>{t("onboarding.bmiHint", { v: bmi })}</p>
              )}
            </section>
          )}

          {step === 1 && (
            <section className={styles.card} aria-label={t("onboarding.lifestyle")}>
              <h2><i className="fa-solid fa-heart-pulse" aria-hidden="true"></i> {t("onboarding.lifestyle")}</h2>
              <div className={styles.field}>
                <span>{t("onboarding.activityQ")}</span>
                <div className={styles.chips}>
                  {ACTIVITY.map((a) => (
                    <Chip key={a.id} selected={activityLevel === a.id} onClick={() => setActivityLevel(a.id)} icon={a.icon}>
                      {a.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <span>{t("onboarding.goalQ")}</span>
                <div className={styles.chips}>
                  {GOALS.map((g) => (
                    <Chip key={g.id} selected={goal === g.id} onClick={() => setGoal(g.id)} icon={g.icon}>
                      {g.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className={styles.grid2}>
                <div className={styles.field}>
                  <span>{t("onboarding.days")}: <strong>{workoutDays}</strong></span>
                  <input
                    className={styles.range} type="range" min="1" max="7" step="1"
                    value={workoutDays} onChange={(e) => setWorkoutDays(Number(e.target.value))}
                    aria-label={t("onboarding.days")}
                  />
                </div>
                <div className={styles.field}>
                  <span>{t("onboarding.sleep")}: <strong>{sleepHours}{t("onboarding.hour")}</strong></span>
                  <input
                    className={styles.range} type="range" min="4" max="10" step="1"
                    value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))}
                    aria-label={t("onboarding.sleep")}
                  />
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className={styles.card} aria-label={t("onboarding.review")}>
              <h2><i className="fa-solid fa-clipboard-check" aria-hidden="true"></i> {t("onboarding.review")}</h2>
              <ul className={styles.review}>
                <li><span>{t("onboarding.weight")}</span><strong>{weightKg || "—"} kg</strong></li>
                <li><span>{t("onboarding.height")}</span><strong>{heightCm || "—"} cm</strong></li>
                <li><span>{t("onboarding.age")}</span><strong>{age || "—"}</strong></li>
                <li><span>{t("onboarding.gender")}</span><strong>{GENDERS.find((g) => g.id === gender)?.label || "—"}</strong></li>
                <li><span>{t("onboarding.lifestyle")}</span><strong>{ACTIVITY.find((a) => a.id === activityLevel)?.label || "—"}</strong></li>
                <li><span>{t("onboarding.goalQ")}</span><strong>{GOALS.find((g) => g.id === goal)?.label || "—"}</strong></li>
                <li><span>{t("onboarding.days")}</span><strong>{workoutDays} / week</strong></li>
                <li><span>{t("onboarding.sleep")}</span><strong>{sleepHours}{t("onboarding.hour")} / night</strong></li>
              </ul>
              <label className={styles.field}>
                <span>{t("onboarding.noteQ")}</span>
                <input
                  className={styles.input} type="text" maxLength={120}
                  placeholder={t("onboarding.notePh")}
                  value={note} onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <p className={styles.hint}>{t("onboarding.privacy")}</p>
            </section>
          )}
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <footer className={styles.nav}>
          <button
            type="button" className={styles.ghostBtn} disabled={step === 0}
            onClick={() => { setError(""); setStep((s) => Math.max(s - 1, 0)); }}
          >
            {t("onboarding.back")}
          </button>
          <button type="button" className={styles.linkBtn} onClick={() => finish(true)}>
            {t("onboarding.skip")}
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className={styles.primaryBtn} onClick={goNext}>
              {t("onboarding.continue")}
            </button>
          ) : (
            <button type="button" className={styles.primaryBtn} onClick={() => finish(false)}>
              {t("onboarding.save")}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
