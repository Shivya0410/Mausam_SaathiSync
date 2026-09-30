"use client";

import React from 'react';
import Link from 'next/link';
import styles from './aboutus.module.css';

// What the app actually contains today, each pointing at a route that exists.
// The previous version of this page was an unedited education template: it
// welcomed visitors to "the EduTech Classes", promised language learning and
// described meals "delivered to the kindergarten".
const FEATURES = [
  {
    icon: 'fas fa-person-walking',
    title: 'Guided yoga and movement',
    text: 'Pose instructions with reference images, plus an optional camera mode that tracks your posture in real time using on-device pose detection.',
    href: '/start',
    cta: 'Open Fitness',
  },
  {
    icon: 'fas fa-bowl-food',
    title: 'Regional Indian recipes',
    text: 'Everyday dishes grouped by region, with healthier swaps for common snacks and a calorie reference built around Indian food.',
    href: '/cards',
    cta: 'Open Dietary',
  },
  {
    icon: 'fas fa-seedling',
    title: 'Sustainable habits',
    text: 'Track everyday choices and explore a virtual forest that grows alongside them, with a carbon footprint calculator to put numbers in context.',
    href: '/sus',
    cta: 'Open Sustain',
  },
  {
    icon: 'fas fa-hand-holding-heart',
    title: 'Mental wellness',
    text: 'A guided breathing exercise and an art therapy space where people share creative work anonymously.',
    href: '/arthub',
    cta: 'Open Serenity',
  },
  {
    icon: 'fas fa-venus',
    title: 'Menstrual health',
    text: 'Log your last period, see it on a calendar, and read through myths and facts. Open to everyone, not gated by the gender on your account.',
    href: '/she',
    cta: 'Open SheFit',
  },
  {
    icon: 'fas fa-chart-line',
    title: 'Progress tracking',
    text: 'A monthly view of yoga, meditation, diet and creative activity, so consistency is visible rather than guessed at.',
    href: '/tracker',
    cta: 'Open Tracker',
  },
];

// Replaces the old "Statistics" row, which listed Virtual Forest with the
// description "Certified Teachers" left over from the template.
const CAPABILITIES = [
  {
    icon: 'fas fa-camera',
    name: 'Pose detection',
    text: 'MoveNet runs in the browser to check yoga posture. Nothing from your camera leaves the device.',
  },
  {
    icon: 'fas fa-tree',
    name: 'Virtual forest',
    text: 'An explorable 3D environment built with A-Frame, tied to the habits you log.',
  },
  {
    icon: 'fas fa-utensils',
    name: 'Recipe library',
    text: 'Regional dishes from across North, South, East and West India, each with a short cooking video.',
  },
  {
    icon: 'fas fa-language',
    name: 'English and Hindi',
    text: 'The interface can be switched between English and Hindi at any point.',
  },
];

function About() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>Wellness that fits an Indian routine</h1>
        <p className={styles.heroLead}>
          Swasth Infinity brings movement, food, mental wellbeing and sustainable
          habits into one place, built around the way people actually eat, move
          and live here rather than a template imported from somewhere else.
        </p>
        <div className={styles.heroActions}>
          <Link href="/start" className={styles.btnPrimary}>
            Start with yoga
          </Link>
          <Link href="/cards" className={styles.btnGhost}>
            Browse recipes
          </Link>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="what-we-offer">
        <h2 id="what-we-offer" className={styles.sectionTitle}>
          What you will find here
        </h2>
        <p className={styles.sectionLead}>
          Six areas, each usable on its own. Start wherever is most useful today.
        </p>

        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <article key={feature.href} className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                <i className={feature.icon}></i>
              </span>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardText}>{feature.text}</p>
              <p className={styles.cardText} style={{ marginTop: '14px' }}>
                <Link href={feature.href}>{feature.cta} →</Link>
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.capabilities} aria-labelledby="how-it-works">
        <h2 id="how-it-works" className={styles.sectionTitle}>
          How it works
        </h2>
        <p className={styles.sectionLead}>
          The pieces doing the work behind those screens.
        </p>

        <div className={styles.capabilityGrid}>
          {CAPABILITIES.map((item) => (
            <div key={item.name} className={styles.capability}>
              <span className={styles.capabilityIcon} aria-hidden="true">
                <i className={item.icon}></i>
              </span>
              <h3 className={styles.capabilityName}>{item.name}</h3>
              <p className={styles.capabilityText}>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta} aria-labelledby="get-started">
        <h2 id="get-started" className={styles.ctaTitle}>
          Built with feedback from people who use it
        </h2>
        <p className={styles.ctaText}>
          Swasth Infinity grew out of conversations with over 175 prospective
          users and discussions with fitness centres across New Delhi. It is
          still developing, and the parts that are not finished yet say so.
        </p>
        <div className={styles.heroActions}>
          <Link href="/register" className={styles.btnPrimary}>
            Create an account
          </Link>
          <Link href="/" className={styles.btnGhost}>
            Back to home
          </Link>
        </div>
      </section>
    </div>
  );
}

export default About;
