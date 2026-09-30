"use client";

import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CycleTracker from "./CycleTracker";
import MythOrFact from "./MythOrFact";
import { HydrationTracker, CoachCards, PhaseGuide, CycleRingCard } from "./SheFitExtra";
import { SavePin, useSavedPins } from "./SavedPins";
import { getWellnessInsights } from "../../utils/wellnessInsights";
import styles from "./shefit.module.css";

// Educational content only - phrased to inform rather than diagnose, per
// the "PCOS can involve..." / "some people experience..." guidance. Kept as
// a plain data array rather than a CMS or extra file, since this is static
// copy with no reuse elsewhere.
const EDUCATION_TOPICS = [
  {
    title: "PCOS & Hormonal Health",
    icon: "fas fa-dna",
    cover: "eduCoverA",
    art: "fas fa-ribbon",
    tagKey: "shefit.tagHormones",
    description: "What PCOS and hormonal changes can look like, in plain language.",
    points: [
      "PCOS (Polycystic Ovary Syndrome) can involve irregular periods, hormonal changes, and symptoms like acne or excess hair growth - but it looks different from person to person.",
      "Hormonal fluctuations are a normal part of the menstrual cycle. Larger or more disruptive changes are worth discussing with a healthcare professional rather than self-diagnosing.",
      "A diagnosis of PCOS or any hormonal condition can only be made by a healthcare professional, usually through a combination of history, examination and tests.",
    ],
  },
  {
    title: "Menstrual Health",
    icon: "fas fa-calendar-days",
    cover: "eduCoverB",
    art: "fas fa-calendar-heart",
    tagKey: "shefit.tagCycle",
    description: "How to make sense of your own cycle, without comparing it to anyone else's.",
    points: [
      "Cycle length and flow can vary widely between people, and even cycle to cycle for the same person - there isn't one universal 'normal'.",
      "Some cramping, mood changes or fatigue around your period are common, but severe pain that disrupts daily life is worth raising with a doctor.",
      "Tracking your own cycle over time - not comparing it to someone else's - is the most useful way to notice what's typical for you.",
    ],
  },
  {
    title: "General Women's Health",
    icon: "fas fa-heart-pulse",
    cover: "eduCoverC",
    art: "fas fa-hand-holding-heart",
    tagKey: "shefit.tagWell",
    description: "Small habits that make it easier to notice changes in your body over time.",
    points: [
      "Regular check-ups, even when nothing feels wrong, help build a health history that makes it easier to notice changes over time.",
      "Symptoms can have many possible explanations - persistent or unusual symptoms are best discussed with a healthcare professional rather than searched and self-assessed.",
      "You know your own body best. If something feels different for you, that's worth mentioning at your next appointment even if it seems minor.",
    ],
  },
  {
    title: "Nutrition, Exercise & Sleep",
    icon: "fas fa-spa",
    cover: "eduCoverD",
    art: "fas fa-apple-whole",
    tagKey: "shefit.tagLife",
    description: "How everyday habits like food, movement and rest connect to how you feel.",
    points: [
      "Balanced meals, regular movement and consistent sleep can all support hormonal balance and general wellbeing, though they aren't a treatment for any specific condition.",
      "Gentle activity is generally fine during your period if you feel up to it - comfort should guide the decision, not a strict rule either way.",
      "Poor sleep and high stress are both commonly linked to cycle changes for many people - if either has shifted a lot recently, it may be worth reflecting on.",
    ],
  },
];

const JUMP_LINKS = [
  ["today", "shefit.navToday", "fa-solid fa-house"],
  ["menstrual-health", "shefit.navTrack", "fa-solid fa-calendar-check"],
  ["cycle-phases", "shefit.navPhases", "fa-solid fa-circle-nodes"],
  ["hydration", "shefit.navWater", "fa-solid fa-droplet"],
  ["coaches", "shefit.navCoaches", "fa-solid fa-user-group"],
  ["wellness-insights", "shefit.navInsights", "fa-solid fa-wand-magic-sparkles"],
  ["myth-or-fact", "shefit.navQuiz", "fa-solid fa-circle-question"],
  ["womens-health-education", "shefit.navLearn", "fa-solid fa-book-open"],
];

function PinCover({ cover, art, tag, pinId, tall }) {
  const { t } = useTranslation();
  return (
    <div className={`${styles.pinCover} ${styles[cover] || ""} ${tall ? styles.pinCoverTall : ""}`}>
      <span className={styles.pinCoverArt} aria-hidden="true">
        <i className={art}></i>
      </span>
      <span className={styles.pinTag}>{t(tag)}</span>
      <SavePin id={pinId} />
    </div>
  );
}

function Shefit() {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState([]);
  const insights = useMemo(() => getWellnessInsights(entries), [entries]);
  const [openTopic, setOpenTopic] = useState(null);
  const { count: savedCount } = useSavedPins();
  const lang = i18n?.language?.startsWith("hi") ? "hi" : "en";
  const todayStr = new Date().toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const toggleTopic = (title) => {
    setOpenTopic((prev) => (prev === title ? null : title));
  };

  return (
    <div className={styles.page}>
      <header className={styles.heroSlim}>
        <div className={styles.heroRow}>
          <span className={styles.heroAvatar} aria-hidden="true">
            <i className="fa-solid fa-flower"></i>
          </span>
          <div className={styles.heroText}>
            <p className={styles.heroKicker}>SHEFIT · {todayStr}</p>
            <h1 className={styles.heroTitle}>{t("shefit.todayInsights")}</h1>
          </div>
          <span className={styles.savedPill} title={t("shefit.savedPin")}>
            <i className="fa-solid fa-bookmark" aria-hidden="true"></i> {savedCount}
          </span>
        </div>
        <nav className={styles.jumpNav} aria-label={t("shefit.jumpTo")}>
          {JUMP_LINKS.map(([href, labelKey, icon]) => (
            <a key={href} href={`#${href}`}>
              <i className={icon} aria-hidden="true"></i> {t(labelKey)}
            </a>
          ))}
        </nav>
      </header>

      <div className={styles.board}>
        {/* Today: ring + phase + glass chips, BloomCycle-style */}
        <section id="today" className={`${styles.section} ${styles.sectionWide}`} aria-labelledby="today-title">
          <h2 id="today-title" className={styles.sectionTitle}>
            {t("shefit.todayTitle")}
          </h2>
          <div className={styles.sectionBody}>
            <CycleRingCard entries={entries} />
          </div>
        </section>

        {/* Featured wide pin: the tracker */}
        <section className={`${styles.section} ${styles.sectionWide}`} aria-labelledby="menstrual-health">
          <PinCover cover="coverTrack" art="fas fa-calendar-days" tag="shefit.tagTrack" pinId="pin-track" tall />
          <h2 id="menstrual-health" className={styles.sectionTitle}>
            {t("shefit.cycleTitle")}
          </h2>
          <div className={styles.sectionBody}>
            <div className={styles.trackerCard}>
              <CycleTracker onEntriesChange={setEntries} />
            </div>
            <p className={styles.privacyNote}>{t("shefit.privacyNote")}</p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="wellness-insights">
          <PinCover cover="coverInsight" art="fas fa-wand-magic-sparkles" tag="shefit.tagInsight" pinId="pin-insights" />
          <h2 id="wellness-insights" className={styles.sectionTitle}>
            {t("shefit.insightsTitle")}
          </h2>
          <div className={styles.sectionBody}>
            <div className={styles.insightsCard}>
              {insights.map((insight, index) => (
                <p key={index} className={styles.insightText}>
                  {insight}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="hydration">
          <PinCover cover="coverWater" art="fas fa-glass-water" tag="shefit.tagWater" pinId="pin-water" />
          <h2 id="hydration" className={styles.sectionTitle}>
            {t("shefit.hydrationTitle")}
          </h2>
          <div className={styles.sectionBody}>
            <HydrationTracker />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="myth-or-fact">
          <PinCover cover="coverQuiz" art="fas fa-circle-question" tag="shefit.tagQuiz" pinId="pin-quiz" />
          <h2 id="myth-or-fact" className={styles.sectionTitle}>
            {t("shefit.quizTitle")}
          </h2>
          <div className={styles.sectionBody}>
            <MythOrFact />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="cycle-phases">
          <PinCover cover="coverPhase" art="fas fa-moon" tag="shefit.tagPhase" pinId="pin-phases" />
          <h2 id="cycle-phases" className={styles.sectionTitle}>
            {t("shefit.phaseTitle")}
          </h2>
          <p className={styles.sectionSubtitle}>{t("shefit.phaseSub")}</p>
          <div className={styles.sectionBody}>
            <PhaseGuide entries={entries} />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="coaches">
          <PinCover cover="coverCoach" art="fas fa-user-group" tag="shefit.tagCoach" pinId="pin-coaches" tall />
          <h2 id="coaches" className={styles.sectionTitle}>
            {t("shefit.coachTitle")}
          </h2>
          <p className={styles.sectionSubtitle}>{t("shefit.coachSub")}</p>
          <div className={styles.sectionBody}>
            <CoachCards />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="womens-health-education">
          <PinCover cover="coverLearn" art="fas fa-book-open" tag="shefit.tagLearn" pinId="pin-learn" tall />
          <h2 id="womens-health-education" className={styles.sectionTitle}>
            {t("shefit.knowTitle")}
          </h2>
          <p className={styles.sectionSubtitle}>{t("shefit.knowSub")}</p>
          <div className={styles.sectionBody}>
            <div className={styles.educationGrid}>
              {EDUCATION_TOPICS.map((topic, ti) => {
                const isOpen = openTopic === topic.title;
                const panelId = `education-panel-${topic.title.replace(/\s+/g, "-")}`;

                return (
                  <div
                    key={topic.title}
                    className={`${styles.educationCard} ${isOpen ? styles.educationCardOpen : ""}`}
                  >
                    <div className={`${styles.eduCover} ${styles[topic.cover]}`}>
                      <span className={styles.eduCoverArt} aria-hidden="true">
                        <i className={topic.art}></i>
                      </span>
                      <span className={styles.eduCoverTag}>{t(topic.tagKey)}</span>
                      <SavePin id={`pin-edu-${ti}`} />
                    </div>
                    <button
                      type="button"
                      className={styles.educationCardHeader}
                      onClick={() => toggleTopic(topic.title)}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                    >
                      <span className={styles.educationIcon} aria-hidden="true">
                        <i className={topic.icon}></i>
                      </span>
                      <span className={styles.educationHeaderText}>
                        <span className={styles.educationTitle}>{topic.title}</span>
                        <span className={styles.educationDescription}>{topic.description}</span>
                      </span>
                      <span className={styles.educationCta}>
                        {isOpen ? "Close" : "Explore"}
                        <i className={`fas fa-chevron-down ${styles.educationChevron}`} aria-hidden="true"></i>
                      </span>
                    </button>

                    <div
                      id={panelId}
                      className={styles.educationPanelWrap}
                      role="region"
                      aria-label={topic.title}
                    >
                      <div className={styles.educationPanelInner}>
                        <ul className={styles.educationList}>
                          {topic.points.map((point, index) => (
                            <li key={index}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className={styles.educationDisclaimer}>
              This information is educational, not a diagnosis. If symptoms are
              persistent or concerning, consider speaking with a healthcare
              professional.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Shefit;
