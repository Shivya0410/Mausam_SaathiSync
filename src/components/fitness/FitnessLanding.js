"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import YogaDashboard from "./YogaDashboard";
import GymDashboard from "./GymDashboard";
import PageHeader from "../layout/PageHeader";
import styles from "./FitnessLanding.module.css";

export default function FitnessLanding() {
  const { t } = useTranslation();
  // Inline mode: clicking a card highlights it and expands its dashboard
  // below the picker instead of navigating away. Full pages still exist at
  // /start/yoga and /start/gym via the "open full page" link.
  const [active, setActive] = useState(null);
  const panelRef = useRef(null);

  const toggle = (mode) => {
    setActive((prev) => (prev === mode ? null : mode));
  };

  const scrollToPanel = () => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cardClass = (mode, base) =>
    `${styles.modeCard} ${base} ${active === mode ? styles.modeCardActive : ""}`;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Slim header bar (shared PageHeader) */}
        <PageHeader title={t('fitness.title')} subtitle={t('fitness.subtitle')} />

        {/* Mode Picker — Yoga & Gym (toggle inline dashboards) */}
        <div className={styles.modePicker} role="tablist" aria-label={t('fitness.title')}>
          {/* Yoga Card */}
          <button
            type="button"
            role="tab"
            aria-selected={active === "yoga"}
            aria-expanded={active === "yoga"}
            onClick={() => toggle("yoga")}
            className={cardClass("yoga", styles.modeYoga)}
          >
            <div className={styles.modeImgWrap}>
              <img src="/yoga-card.jpg" alt={t('fitness.yogaAlt')} />
            </div>
            <div className={styles.modeBody}>
              <span className={styles.modeCategory}>{t('fitness.yogaCat')}</span>
              <h2 className={styles.modeTitle}>🧘 {t('fitness.yoga')}</h2>
              <p className={styles.modeTagline}>{t('fitness.yogaTag')}</p>
              <div className={`${styles.modeBtn} ${styles.modeBtnYoga}`}>
                {active === "yoga" ? t('fitness.hideBtn') : t('fitness.yogaBtn')}{' '}
                <span className={styles.modeBtnArrow}>{active === "yoga" ? "▾" : "▸"}</span>
              </div>
            </div>
          </button>

          {/* Gym Card */}
          <button
            type="button"
            role="tab"
            aria-selected={active === "gym"}
            aria-expanded={active === "gym"}
            onClick={() => toggle("gym")}
            className={cardClass("gym", styles.modeGym)}
          >
            <div className={styles.modeImgWrap}>
              <img src="/gym-card.jpg" alt={t('fitness.gymAlt')} />
            </div>
            <div className={styles.modeBody}>
              <span className={styles.modeCategory}>{t('fitness.gymCat')}</span>
              <h2 className={styles.modeTitle}>🏋️ {t('fitness.gym')}</h2>
              <p className={styles.modeTagline}>{t('fitness.gymTag')}</p>
              <div className={`${styles.modeBtn} ${styles.modeBtnGym}`}>
                {active === "gym" ? t('fitness.hideBtn') : t('fitness.gymBtn')}{' '}
                <span className={styles.modeBtnArrow}>{active === "gym" ? "▾" : "▸"}</span>
              </div>
            </div>
          </button>
        </div>

        {/* Inline dashboard panel */}
        {active && (
          <>
            <button
              type="button"
              className={styles.scrollArrow}
              onClick={scrollToPanel}
              aria-label={t('fitness.scrollDown')}
            >
              <span className={styles.scrollArrowText}>{t('fitness.scrollDown')}</span>
              <span className={styles.scrollArrowIcon} aria-hidden="true">↓</span>
            </button>
            <div className={styles.inlinePanel} ref={panelRef}>
            <div className={styles.inlineBar}>
              <span className={styles.inlineCrumb}>
                {active === "yoga" ? `🧘 ${t('fitness.yoga')}` : `🏋️ ${t('fitness.gym')}`}
              </span>
              <Link
                href={active === "yoga" ? "/start/yoga" : "/start/gym"}
                className={styles.inlineFullLink}
              >
                {t('fitness.openFullPage')} →
              </Link>
            </div>
            {active === "yoga" ? <YogaDashboard /> : <GymDashboard />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
