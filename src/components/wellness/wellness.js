"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import PageHeader from "../layout/PageHeader";
import styles from "./wellness.module.css";

// The two functional assessments this section links out to. Their
// detection/state-machine logic and result screens already exist under
// src/components/seniorFitness/ and are not touched here - this page only
// introduces the entry point and explains what each test measures.
const SENIOR_TESTS = [
  {
    icon: "fas fa-chair",
    title: "30-Second Chair Stand Test",
    text: "A simple functional assessment that indicates lower-body strength by counting how many times you can safely stand up and sit back down in 30 seconds.",
    result: "Result: number of completed repetitions, a functional strength indicator.",
    href: "/chair-stand-test",
    cta: "Start Test",
  },
  {
    icon: "fas fa-scale-balanced",
    title: "Balance & Stability Test",
    text: "A short, guided check that gives a simple functional stability indicator based on how steady you can stand for 30 seconds.",
    result: "Result: a stability percentage, a functional stability indicator.",
    href: "/balance-test",
    cta: "Start Test",
  },
];

const COMING_SOON = [
  { icon: "fas fa-person-walking", label: "Mobility" },
  { icon: "fas fa-bowl-food", label: "Nutrition" },
  { icon: "fas fa-hand-holding-heart", label: "Mental Wellbeing" },
  { icon: "fas fa-seedling", label: "Healthy Aging" },
];

// Top of the wellness page: purple banner, then the two assessment models
// in the original card look. Ayurveda follows below in the hub.
export function SeniorModels() {
  const { t } = useTranslation();
  return (
    <div className={styles.topFlow}>
      <div className={styles.topBarWrap}>
        <PageHeader title={t('wellness.title')} subtitle={t('wellness.heroSub')} />
      </div>

      <section className={styles.modelsSection} aria-labelledby="senior-wellness-check">
        <div className={styles.modelsSectionHead}>
          <h2 id="senior-wellness-check" className={styles.sectionTitle}>
            Senior Wellness Check
          </h2>
          <p className={styles.sectionLead}>
            Simple, senior-friendly functional wellness assessments designed to
            help older adults understand their movement, strength and
            stability.
          </p>
        </div>

        <div className={styles.testGrid}>
          {SENIOR_TESTS.map((test) => (
            <article key={test.href} className={styles.testCard}>
              <span className={styles.testIcon} aria-hidden="true">
                <i className={test.icon}></i>
              </span>
              <h3 className={styles.testTitle}>{test.title}</h3>
              <p className={styles.testText}>{test.text}</p>
              <p className={styles.testResult}>{test.result}</p>
              <Link href={test.href} className={styles.testCta}>
                {test.cta} →
              </Link>
            </article>
          ))}
        </div>

        <p className={styles.disclaimer}>
          These are functional wellness assessments, not a medical diagnosis.
          If you feel unsteady or unwell, stop and check with a healthcare
          professional.
        </p>
      </section>
    </div>
  );
}

// Journey explainer + coming-soon pills — rendered after the hub sections.
// Compact 3-step strip — small fonts, sits right under the model cards.
export function WellnessSteps() {
  const STEPS = [
    { n: "1", label: "Assessment", text: "Take a short, guided test using your camera." },
    { n: "2", label: "Result", text: "See your rep count or stability percentage right away." },
    { n: "3", label: "Wellness guidance", text: "Read a simple, non-clinical note on what your result suggests." },
  ];
  return (
    <section className={styles.stepsCompact} aria-labelledby="your-wellness-check">
      <div className={styles.stepsCompactCard}>
        <h2 id="your-wellness-check" className={styles.stepsCompactTitle}>
          Your Wellness Check
        </h2>
        <p className={styles.stepsCompactLead}>
          Complete the assessments to receive simple functional wellness indicators and guidance.
        </p>
        <div className={styles.stepsCompactRow}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={styles.stepsCompactStep}>
                <span className={styles.stepsCompactNum}>{s.n}</span>
                <div>
                  <h3 className={styles.stepsCompactLabel}>{s.label}</h3>
                  <p className={styles.stepsCompactText}>{s.text}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <i className={`fas fa-arrow-right ${styles.stepsCompactArrow}`} aria-hidden="true"></i>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

// Coming-soon pills — last on the page.
export function ComingSoon() {
  return (
    <section className={styles.comingSoon} aria-labelledby="more-wellness">
      <h2 id="more-wellness" className={styles.comingSoonTitle}>
        More wellness features coming soon
      </h2>
      <div className={styles.comingSoonGrid}>
        {COMING_SOON.map((item) => (
          <span key={item.label} className={styles.comingSoonPill}>
            <i className={item.icon} aria-hidden="true"></i>
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}

export function WellnessExtras() {
  return (
    <>
      <section className={styles.journeySection} aria-labelledby="your-wellness-check">
        <h2 id="your-wellness-check" className={styles.sectionTitle}>
          Your Wellness Check
        </h2>
        <p className={styles.sectionLead}>
          Complete the assessments to receive simple functional wellness
          indicators and guidance.
        </p>

        <div className={styles.journeySteps}>
          <div className={styles.journeyStep}>
            <span className={styles.journeyNumber}>1</span>
            <h3 className={styles.journeyLabel}>Assessment</h3>
            <p className={styles.journeyText}>
              Take a short, guided test using your camera.
            </p>
          </div>
          <i className={`fas fa-arrow-right ${styles.journeyArrow}`} aria-hidden="true"></i>
          <div className={styles.journeyStep}>
            <span className={styles.journeyNumber}>2</span>
            <h3 className={styles.journeyLabel}>Result</h3>
            <p className={styles.journeyText}>
              See your rep count or stability percentage right away.
            </p>
          </div>
          <i className={`fas fa-arrow-right ${styles.journeyArrow}`} aria-hidden="true"></i>
          <div className={styles.journeyStep}>
            <span className={styles.journeyNumber}>3</span>
            <h3 className={styles.journeyLabel}>Wellness guidance</h3>
            <p className={styles.journeyText}>
              Read a simple, non-clinical note on what your result suggests.
            </p>
          </div>
        </div>
      </section>

      <ComingSoon />
    </>
  );
}

function Wellness() {
  return (
    <div className={styles.page}>
      <SeniorModels />
      <WellnessExtras />
    </div>
  );
}

export default Wellness;
