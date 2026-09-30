"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../store/auth";
import PageHeader from "../layout/PageHeader";
import CommunityFeed from "./CommunityFeed";
import { EVENTS } from "../../data/fitnessEvents";
import { POSTS } from "../../data/communityFeed";
import { getBadges } from "../../utils/badges";
import styles from "./CommunityHub.module.css";

// Rotating motivation, resolved per language.
const QUOTES = [
  { en: "Consistency beats intensity. Show up today.", hi: "निरंतरता तीव्रता से बड़ी है। आज हाज़िर रहें।" },
  { en: "Small steps every day become big change.", hi: "रोज़ के छोटे कदम बड़ा बदलाव बनते हैं।" },
  { en: "Your only competition is yesterday's you.", hi: "आपकी एकमात्र प्रतिस्पर्धा कल के आप से है।" },
  { en: "Sweat now, shine later.", hi: "अभी पसीना, बाद में चमक।" },
  { en: "A 10-minute walk still counts. Move a little.", hi: "10 मिनट की सैर भी मायने रखती है। थोड़ा हिलें।" },
  { en: "Rest is training too. Sleep well tonight.", hi: "आराम भी प्रशिक्षण है। आज अच्छी नींद लें।" },
  { en: "Plant a tree, log a workout, inspire someone.", hi: "पेड़ लगाएँ, वर्कआउट लॉग करें, किसी को प्रेरित करें।" },
];

function quoteOfDay(lang) {
  const day = Math.floor(Date.now() / 86400000);
  const q = QUOTES[day % QUOTES.length];
  return lang === "hi" ? q.hi : q.en;
}

/** LeetCode-style contribution heatmap from this browser's tracker data. */
function useActivityHeat() {
  return useMemo(() => {
    const days = new Map(); // YYYY-MM-DD -> intensity 0..4
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith("swasth.tracker.v1::")) continue;
        const all = JSON.parse(localStorage.getItem(k) || "{}");
        Object.entries(all).forEach(([monthId, month]) => {
          const [y, m] = monthId.split("-").map(Number);
          Object.entries(month || {}).forEach(([day, entry]) => {
            const n = Object.values(entry || {}).filter(Boolean).length;
            if (!n) return;
            const id = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            days.set(id, Math.max(days.get(id) || 0, n));
          });
        });
      }
    } catch {
      /* ignore */
    }
    const cells = [];
    const today = new Date();
    for (let d = 83; d >= 0; d--) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - d);
      const id = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      cells.push({ id, level: days.get(id) || 0 });
    }
    return cells;
  }, []);
}

function upcomingEvents() {
  const today = new Date().toISOString().slice(0, 10);
  return EVENTS.filter((e) => (e.endDate || e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);
}

export default function CommunityHub() {  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [tab, setTab] = useState("stories");
  const heat = useActivityHeat();
  const events = useMemo(upcomingEvents, []);
  const lang = i18n?.language?.startsWith("hi") ? "hi" : "en";
  const badgeCount = getBadges(user).length;
  const heatTotal = heat.filter((c) => c.level > 0).length;

  const tabs = [
    ["stories", t("hub.tabStories"), "fa-solid fa-book-open"],
    ["events", t("hub.tabEvents"), "fa-solid fa-calendar-star"],
    ["planet", t("hub.tabPlanet"), "fa-solid fa-seedling"],
    ["motivation", t("hub.tabMotivation"), "fa-solid fa-fire"],
  ];

  return (
    <>
      <div className={styles.heroBleed}>
        <div className={styles.heroInner}>
          <PageHeader title={t("hub.title")} subtitle={t("hub.lead")} chipText={t("hub.kicker")} />
          <div className={styles.tabbar} role="tablist" aria-label={t("hub.title")}>
            {tabs.map(([id, label, icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`${styles.tab} ${tab === id ? styles.tabActive : ""}`}
                onClick={() => setTab(id)}
              >
                <i className={icon}></i> {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    <div className={styles.page}>

      {tab === "stories" && (
        <>
          <div className={styles.ctaRow}>
            <Link href="/tracker" className={styles.cta}>
              <i className="fa-solid fa-person-running"></i>
              <span>
                <strong>{t("hub.logWorkout")}</strong>
                <small>{t("hub.logWorkoutD")}</small>
              </span>
            </Link>
            <Link href="/arthub" className={styles.cta}>
              <i className="fa-solid fa-pen-nib"></i>
              <span>
                <strong>{t("hub.shareStory")}</strong>
                <small>{t("hub.shareStoryD")}</small>
              </span>
            </Link>
          </div>
          <div className={styles.feedEmbed}>
            <CommunityFeed />
          </div>
        </>
      )}

      {tab === "events" && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{t("hub.upcomingTitle")}</h2>
            <Link href="/events" className={styles.more}>{t("hub.viewAllEvents")} →</Link>
          </div>
          <div className={styles.eventGrid}>
            {events.map((e) => (
              <Link key={e.id} href={`/events/${e.city}/${e.id}`} className={styles.eventCard}>
                <span className={styles.eventDate}>{e.date}</span>
                <strong>{e.title}</strong>
                <small>
                  <i className="fa-solid fa-location-dot"></i> {e.venue} · {e.city}
                </small>
              </Link>
            ))}
            {events.length === 0 && <p>{t("hub.noEvents")}</p>}
          </div>
        </section>
      )}

      {tab === "planet" && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>{t("hub.planetTitle")}</h2>
            <Link href="/sus" className={styles.more}>{t("hub.openSustain")} →</Link>
          </div>
          <div className={styles.planetGrid}>
            <div className={styles.planetCard}>
              <i className="fa-solid fa-cloud"></i>
              <strong>{t("hub.carbonTitle")}</strong>
              <p>{t("hub.carbonD")}</p>
            </div>
            <div className={styles.planetCard}>
              <i className="fa-solid fa-tree"></i>
              <strong>{t("hub.forestTitle")}</strong>
              <p>{t("hub.forestD")}</p>
            </div>
            <div className={styles.planetCard}>
              <i className="fa-solid fa-recycle"></i>
              <strong>{t("hub.pointsTitle")}</strong>
              <p>{t("hub.pointsD")}</p>
            </div>
          </div>
        </section>
      )}

      {tab === "motivation" && (
        <section className={styles.section}>
          <blockquote className={styles.quote}>
            “{quoteOfDay(lang)}”
          </blockquote>
          <div className={styles.statsRow}>
            <div className={styles.stat}><strong>{POSTS.length}</strong><span>{t("hub.statStories")}</span></div>
            <div className={styles.stat}><strong>{events.length}</strong><span>{t("hub.statEvents")}</span></div>
            <div className={styles.stat}><strong>{heatTotal}</strong><span>{t("hub.statActive")}</span></div>
            <div className={styles.stat}><strong>{badgeCount}</strong><span>{t("hub.statBadges")}</span></div>
          </div>
          <h2 className={styles.heatTitle}>{t("hub.heatTitle")}</h2>
          <div className={styles.heat} role="img" aria-label={t("hub.heatTitle")}>
            {heat.map((c) => (
              <span key={c.id} title={c.id} className={`${styles.cell} ${styles[`lvl${c.level}`]}`} />
            ))}
          </div>
          <p className={styles.heatHint}>{t("hub.heatHint")}</p>
        </section>
      )}
    </div>
    </>
  );
}
