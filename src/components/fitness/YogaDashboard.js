"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import styles from "./YogaDashboard.module.css";

/* ─── Static data (text resolves via i18n at render) ──────────── */

const GURUS = [
  { name: "Raghav Ji", styleKey: "fitness.styleHatha", img: "/guru-1.jpg" },
  { name: "Anushka Verma", styleKey: "fitness.styleVinyasa", img: "/guru-2.jpg" },
  { name: "Meera Iyer", styleKey: "fitness.styleMeditation", img: "/guru-3.jpg" },
  { name: "Kunal Sharma", styleKey: "fitness.styleAshtanga", img: "/guru-4.jpg" },
];

const VENUES = [
  {
    name: "Central Park Yoga Ground",
    dist: "1.8",
    tags: [
      { labelKey: "fitness.tagOutdoor", style: "tagGreen" },
      { labelKey: "fitness.tagGroup", style: "tagBlue" },
    ],
    cropPosition: "0% 0%",
  },
  {
    name: "Santoshi Yoga Centre",
    dist: "2.4",
    tags: [
      { labelKey: "fitness.tagIndoor", style: "tagPurple" },
      { labelKey: "fitness.tagCertified", style: "tagOrange" },
    ],
    cropPosition: "33.33% 0%",
  },
  {
    name: "Riverside Wellness Park",
    dist: "3.1",
    tags: [
      { labelKey: "fitness.tagOutdoor", style: "tagGreen" },
      { labelKey: "fitness.tagMorning", style: "tagOrange" },
    ],
    cropPosition: "66.66% 0%",
  },
];

/* September 2025 calendar data — Mon-start. Empty slots = 0. */
const SEPT_2025 = [
  /* row 1 */ 1, 2, 3, 4, 5, 6, 7,
  /* row 2 */ 8, 9, 10, 11, 12, 13, 14,
  /* row 3 */ 15, 16, 17, 18, 19, 20, 21,
  /* row 4 */ 22, 23, 24, 25, 26, 27, 28,
  /* row 5 */ 29, 30, 0, 0, 0, 0, 0,
];
const EVENT_DAYS = new Set([4, 5, 14, 15, 17, 24, 27]);
const SPECIAL_DAYS = new Set([27]);
const TODAY = 14;

/* ─── Component ────────────────────────────────────────────── */

export default function YogaDashboard() {
  const { t, i18n } = useTranslation();
  const locale = i18n?.language?.startsWith('hi') ? 'hi-IN' : 'en-US';
  // Locale-aware short weekday names starting Sunday (Sept 7, 2025 was a Sunday).
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2025, 8, 7 + i).toLocaleString(locale, { weekday: 'short' })
  );

  return (
    <div className={styles.page}>
      {/* ═══ TOP BREADCRUMB ═══ */}
      <div className={styles.topBar}>
        <Link href="/start" className={styles.backBtn}>
          <span>←</span> {t('fitness.backModes')}
        </Link>
        <span className={styles.categoryBadge}>🧘 {t('fitness.yogaBadge')}</span>
      </div>

      {/* ═══ HERO BANNER ═══ */}
      <section className={styles.hero}>
        <img
          className={styles.heroImage}
          src="/hero-banner.jpg"
          alt={t('fitness.heroAlt')}
        />
        <div className={styles.heroOverlay}>
          <span className={styles.heroEyebrow}>{t('fitness.eyebrow')}</span>
          <h1 className={styles.heroTitle}>{t('fitness.yogaTitle')}</h1>
          <p className={styles.heroSubtitle}>{t('fitness.yogaTrio')}</p>
          <Link href="/start/yoga/practice" className={styles.heroCta}>
            {t('fitness.startPractice')} <span>→</span>
          </Link>
        </div>
        <p className={styles.heroQuote}>&ldquo;{t('fitness.quote')}&rdquo;</p>
      </section>

      {/* ═══ DASHBOARD GRID ═══ */}
      <div className={styles.dashGrid}>
        {/* ─── 1. Pose Coach ─── */}
        <div className={`${styles.card} ${styles.poseCoach}`}>
          <div className={styles.poseCoachLeft}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIcon} ${styles.iconPurple}`}>🧘</div>
              <h2 className={styles.cardTitle}>{t('fitness.poseCoach')}</h2>
            </div>
            <p className={styles.cardSub}>{t('fitness.poseCoachSub')}</p>
            <Link href="/start/yoga/practice" className={styles.cardBtn}>
              {t('fitness.tryNow')} <span>→</span>
            </Link>
          </div>
          <div className={styles.poseCoachRight}>
            <img
              className={styles.poseImg}
              src="/pose-coach.jpg"
              alt={t('fitness.poseAlt')}
            />
            <div className={styles.accuracyRing}>
              <svg viewBox="0 0 80 80">
                <circle className={styles.ringBg} cx="40" cy="40" r="36" />
                <circle className={styles.ringFill} cx="40" cy="40" r="36" />
              </svg>
              <div className={styles.ringLabel}>
                <span className={styles.ringPercent}>92%</span>
                <span className={styles.ringText}>{t('fitness.accuracy')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 2. Yoga Gurus ─── */}
        <div className={`${styles.card} ${styles.gurusCard}`}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.iconAmber}`}>✨</div>
            <h2 className={styles.cardTitle}>{t('fitness.gurus')}</h2>
          </div>
          <p className={styles.cardSub}>{t('fitness.gurusSub')}</p>
          <div className={styles.gurusRow}>
            {GURUS.map((g) => (
              <div key={g.name} className={styles.guruItem}>
                <img className={styles.guruAvatar} src={g.img} alt={g.name} />
                <span className={styles.guruName}>{g.name}</span>
                <span className={styles.guruStyle}>{t(g.styleKey)}</span>
              </div>
            ))}
            <button className={styles.gurusArrow} aria-label={t('fitness.moreGurus')}>›</button>
          </div>
          <div className={styles.guruCardBottom}>
            <Link href="/yoga" className={styles.cardBtn}>
              {t('fitness.exploreGurus')} <span>→</span>
            </Link>
          </div>
        </div>

        {/* ─── 3. Yoga Calendar ─── */}
        <div className={`${styles.card}`}>
          <div className={styles.cardHeader}>
            <div className={`${styles.cardIcon} ${styles.iconTeal}`}>📅</div>
            <h2 className={styles.cardTitle}>{t('fitness.calTitle')}</h2>
          </div>
          <p className={styles.cardSub}>{t('fitness.calSub')}</p>
          <div className={styles.calendarCard}>
            <div className={styles.calendarWidget}>
              <div className={styles.calMonthHeader}>
                <div className={styles.calNav}>
                  <button className={styles.calNavBtn} aria-label={t('fitness.prevMonth')}>‹</button>
                </div>
                <span className={styles.calMonthTitle}>{t('fitness.calMonth')}</span>
                <div className={styles.calNav}>
                  <button className={styles.calNavBtn} aria-label={t('fitness.nextMonth')}>›</button>
                </div>
              </div>
              <div className={styles.calGrid}>
                {weekdays.map((d) => (
                  <span key={d} className={styles.calDayHeader}>{d}</span>
                ))}
                {SEPT_2025.map((day, i) => {
                  if (day === 0) return <span key={`e${i}`} className={styles.calDayEmpty} />;
                  const isToday = day === TODAY;
                  const isEvent = EVENT_DAYS.has(day);
                  const isSpecial = SPECIAL_DAYS.has(day);
                  return (
                    <span
                      key={day}
                      className={`${styles.calDay} ${isToday ? styles.calDayToday : ""} ${isEvent && !isToday ? styles.calDayEvent : ""} ${isSpecial && !isToday ? styles.calDaySpecial : ""}`}
                    >
                      {isToday ? <span className={styles.calDayToday}>{day}</span> : day}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className={styles.calendarRight}>
              <div className={styles.calCategory}>
                <span className={styles.catIcon}>📍</span> {t('fitness.catParks')}
              </div>
              <div className={styles.calCategory}>
                <span className={styles.catIcon}>🏛️</span> {t('fitness.catCommunity')}
              </div>
              <div className={styles.calCategory}>
                <span className={styles.catIcon}>🎪</span> {t('fitness.catEvents')}
              </div>
              <Link href="/yoga" className={styles.cardBtn} style={{ marginTop: "auto" }}>
                {t('fitness.viewCalendar')} <span>→</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ─── 4. My Yoga Pledge ─── */}
        <div className={`${styles.card}`}>
          <div className={styles.pledgeCard}>
            <div className={styles.pledgeLeft}>
              <div className={styles.cardHeader}>
                <div className={`${styles.cardIcon} ${styles.iconPink}`}>🪷</div>
                <h2 className={styles.cardTitle}>{t('fitness.pledge')}</h2>
              </div>
              <p className={styles.cardSub}>{t('fitness.pledgeSub')}</p>
              <Link href="/yoga" className={styles.cardBtn}>
                {t('fitness.takePledge')} <span>→</span>
              </Link>
            </div>
            <div className={styles.pledgeCert}>
              <span className={styles.pledgeLotus}>🪷</span>
              <span className={styles.pledgeCertTitle}>{t('fitness.pledge')}</span>
              <div className={styles.pledgeCheck}>✓</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ NEAR YOU SECTION ═══ */}
      <section className={styles.nearSection}>
        <div className={styles.nearHeader}>
          <div className={styles.nearHeaderLeft}>
            <span className={styles.nearIcon}>📍</span>
            <h2 className={styles.nearTitle}>{t('fitness.nearYou')}</h2>
            <span className={styles.nearSub}>{t('fitness.nearSub')}</span>
          </div>
          <Link href="/yoga" className={styles.viewAll}>{t('fitness.viewAll')} →</Link>
        </div>
        <div className={styles.nearGrid}>
          {VENUES.map((v) => (
            <div key={v.name} className={styles.venueCard}>
              <div className={styles.venueImgWrap}>
                <img
                  className={styles.venueImg}
                  src="/venues.jpg"
                  alt={v.name}
                  style={{ objectPosition: v.cropPosition }}
                />
              </div>
              <div className={styles.venueBody}>
                <h3 className={styles.venueName}>{v.name}</h3>
                <p className={styles.venueDistance}>📍 {t('fitness.kmAway', { d: v.dist })}</p>
                <div className={styles.venueTags}>
                  {v.tags.map((tag) => (
                    <span key={tag.labelKey} className={`${styles.venueTag} ${styles[tag.style]}`}>
                      {t(tag.labelKey)}
                    </span>
                  ))}
                </div>
                <button className={styles.venueBtn}>{t('fitness.view')}</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
