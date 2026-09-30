"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./GymDashboard.module.css";

/* ─── Static Data ─────────────────────────────────────────── */

const WORKOUT_PLANS = [
  {
    title: "Build Strength",
    desc: "Get stronger, step by step",
    img: "/plan-strength.jpg",
    link: "/start/gym",
  },
  {
    title: "Lose Fat",
    desc: "Stay active, feel lighter",
    img: "/plan-fatloss.jpg",
    link: "/start/gym",
  },
  {
    title: "Tone & Flex",
    desc: "A stronger, more agile you",
    img: "/plan-tone.jpg",
    link: "/start/gym",
  },
];

const NEARBY_GYMS = [
  {
    name: "Cult Fit",
    distance: "📍 1.2 km away",
    img: "/gym-venue-1.jpg",
    tags: ["Gym", "Group Classes"],
  },
  {
    name: "Fit7 by M&S",
    distance: "📍 2.4 km away",
    img: "/gym-venue-2.jpg",
    tags: ["Gym", "Personal Training"],
  },
  {
    name: "Decathlon Fitness Centre",
    distance: "📍 3.1 km away",
    img: "/gym-venue-3.jpg",
    tags: ["Affordable", "Open Gym"],
  },
];

const FIT_INDIA_CHALLENGES = [
  { title: "10K Steps India", badge: "Active 🏃‍♂️" },
  { title: "30-Day Fitness Challenge", badge: "Streak 🔥" },
  { title: "Campus Fitness Challenge", badge: "Leaderboard 🏆" },
  { title: "Run for Your City", badge: "Upcoming 🇮🇳" },
];

const WEEKLY_BARS = [
  { day: "M", height: "45%" },
  { day: "T", height: "70%" },
  { day: "W", height: "60%" },
  { day: "T", height: "90%" },
  { day: "F", height: "80%" },
  { day: "S", height: "100%" },
  { day: "S", height: "55%" },
];

/* ─── Component ────────────────────────────────────────────── */

export default function GymDashboard() {
  const [activeTab, setActiveTab] = useState("This Week");

  return (
    <div className={styles.page}>
      {/* ═══ TOP BREADCRUMB ═══ */}
      <div className={styles.topBar}>
        <Link href="/start" className={styles.backBtn}>
          <span>←</span> Back to Fitness Modes
        </Link>
        <span className={styles.categoryBadge}>🏋️ Gym &amp; Strength</span>
      </div>

      {/* ═══ HERO BANNER ═══ */}
      <section className={styles.hero}>
        <img
          className={styles.heroImage}
          src="/gym-hero-banner.jpg"
          alt="Modern Indian woman training with weights in a gym"
        />
        <div className={styles.heroOverlay}>
          <div className={styles.heroContent}>
            <span className={styles.heroEyebrow}>Discipline Today, A Stronger Tomorrow</span>
            <h1 className={styles.heroTitle}>Your Gym, Your Growth</h1>
            <p className={styles.heroSubtitle}>Track &nbsp;•&nbsp; Improve &nbsp;•&nbsp; Stay Consistent</p>
            <Link href="/start/gym/coach" className={styles.heroCta}>
              Start Workout <span>→</span>
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStatPill}>
              <span className={styles.heroStatIcon}>🏋️</span>
              <span>Build Strength</span>
            </div>
            <div className={styles.heroStatPill}>
              <span className={styles.heroStatIcon}>⚡</span>
              <span>Boost Energy</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TOP 3-COLUMN GRID ═══ */}
      <div className={styles.threeColGrid}>
        {/* ─── 1. AI Workout Coach ─── */}
        <div className={`${styles.card} ${styles.coachCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={`${styles.cardIcon} ${styles.iconPurple}`}>🤖</div>
              <h2 className={styles.cardTitle}>AI Workout Coach</h2>
            </div>
          </div>
          <p className={styles.cardSub}>
            Real-time posture correction, repetition counting &amp; form feedback
          </p>
          <div className={styles.coachBody}>
            <div className={styles.coachImgWrap}>
              <img
                className={styles.coachImg}
                src="/gym-ai-squat.jpg"
                alt="AI pose estimation on squat exercise"
              />
              <div className={styles.coachBadge}>
                <span className={styles.liveDot} />
                AI Tracking Active
              </div>
            </div>
            <div className={styles.coachPanel}>
              <div className={styles.coachRow}>
                <span className={styles.coachLabel}>Exercise</span>
                <span className={styles.coachValue}>🏋️ Squat</span>
              </div>
              <div className={styles.coachRow}>
                <span className={styles.coachLabel}>Reps</span>
                <span className={styles.coachValue} style={{ color: "#2e7d32" }}>
                  12 / 15
                </span>
              </div>
              <div className={styles.coachRow}>
                <span className={styles.coachLabel}>Form Status</span>
                <span className={styles.goodTag}>✓ Good Form</span>
              </div>
              <div className={styles.coachTip}>
                <span>💡</span>
                <span>Keep your back straight and knees aligned over toes.</span>
              </div>
            </div>
          </div>
          <Link href="/start/gym/coach" className={styles.coachBtn}>
            Try Now <span>→</span>
          </Link>
        </div>

        {/* ─── 2. Your Progress ─── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={`${styles.cardIcon} ${styles.iconBlue}`}>📊</div>
              <h2 className={styles.cardTitle}>Your Progress</h2>
            </div>
          </div>
          <div className={styles.progressTabs}>
            {["This Week", "This Month", "All Time"].map((tab) => (
              <button
                key={tab}
                className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className={styles.progressStats}>
            <div className={styles.pStatBox}>
              <span className={styles.pStatVal}>5</span>
              <span className={styles.pStatLabel}>Workouts</span>
            </div>
            <div className={styles.pStatBox}>
              <span className={styles.pStatVal}>
                1,240 <small>kcal</small>
              </span>
              <span className={styles.pStatLabel}>Calories</span>
            </div>
            <div className={styles.pStatBox}>
              <span className={styles.pStatVal}>
                210 <small>min</small>
              </span>
              <span className={styles.pStatLabel}>Active Time</span>
            </div>
          </div>
          <div className={styles.progressChart}>
            <div className={styles.chartBars}>
              {WEEKLY_BARS.map((b, i) => (
                <div key={i} className={styles.chartBarCol}>
                  <div className={styles.chartBar} style={{ height: b.height }} />
                  <span className={styles.chartDay}>{b.day}</span>
                </div>
              ))}
            </div>
            <p className={styles.chartQuote}>&ldquo;Consistency today, results tomorrow.&rdquo;</p>
          </div>
        </div>

        {/* ─── 3. Personalised Workout Plans ─── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={`${styles.cardIcon} ${styles.iconOrange}`}>📋</div>
              <h2 className={styles.cardTitle}>Personalised Plans</h2>
            </div>
            <Link href="/start/gym" className={styles.cardLink}>View All →</Link>
          </div>
          <p className={styles.cardSub}>Tailored for your specific fitness goals</p>
          <div className={styles.plansList}>
            {WORKOUT_PLANS.map((plan) => (
              <Link key={plan.title} href={plan.link} className={styles.planCard}>
                <div className={styles.planImgWrap}>
                  <img className={styles.planImg} src={plan.img} alt={plan.title} />
                </div>
                <div className={styles.planBody}>
                  <span className={styles.planTitle}>{plan.title}</span>
                  <span className={styles.planDesc}>{plan.desc}</span>
                  <span className={styles.planArrow}>→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MIDDLE 3-COLUMN GRID ═══ */}
      <div className={styles.threeColGrid}>
        {/* ─── 4. Nearby Gyms & Fitness Centres ─── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={`${styles.cardIcon} ${styles.iconPurple}`}>📍</div>
              <h2 className={styles.cardTitle}>Nearby Gyms &amp; Spaces</h2>
            </div>
            <Link href="/start/gym" className={styles.cardLink}>View All →</Link>
          </div>
          <p className={styles.cardSub}>Find verified gyms, parks &amp; open spaces</p>
          <div className={styles.gymsRow}>
            {NEARBY_GYMS.map((gym) => (
              <div key={gym.name} className={styles.gymItem}>
                <div className={styles.gymImgWrap}>
                  <img className={styles.gymImg} src={gym.img} alt={gym.name} />
                </div>
                <div className={styles.gymInfo}>
                  <span className={styles.gymName}>{gym.name}</span>
                  <span className={styles.gymDistance}>{gym.distance}</span>
                  <div className={styles.gymTags}>
                    {gym.tags.map((tag) => (
                      <span key={tag} className={`${styles.gTag} ${tag === 'Open Gym' ? styles.gTagGreen : ''}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className={styles.gymBtn}>View</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 5. Fit India Challenges 🇮🇳 ─── */}
        <div className={`${styles.card} ${styles.fitIndiaCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={`${styles.cardIcon} ${styles.iconOrange}`}>🏆</div>
              <h2 className={styles.cardTitle}>Fit India Challenges 🇮🇳</h2>
            </div>
            <Link href="/start/gym" className={styles.cardLink}>View All →</Link>
          </div>
          <p className={styles.cardSub}>Move together, get fitter together</p>
          <div className={styles.fitIndiaBanner}>
            <img
              className={styles.fitIndiaImg}
              src="/fit-india.jpg"
              alt="Fit India Community Movement"
            />
            <div className={styles.fitIndiaOverlay}>
              <span className={styles.fitIndiaLogoText}>FIT INDIA</span>
              <span className={styles.fitIndiaTagline}>Move to a Better You</span>
            </div>
          </div>
          <div className={styles.fitChallengesList}>
            {FIT_INDIA_CHALLENGES.map((c) => (
              <div key={c.title} className={styles.fitChallengeItem}>
                <span>{c.title}</span>
                <span className={styles.fitBadge}>{c.badge}</span>
              </div>
            ))}
          </div>
          <Link href="/start/gym" className={styles.fitIndiaBtn}>
            Join Challenge <span>→</span>
          </Link>
        </div>

        {/* ─── 6. Fuel Your Fitness 🥗 ─── */}
        <div className={`${styles.card} ${styles.nutritionCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderLeft}>
              <div className={`${styles.cardIcon} ${styles.iconGreen}`}>🥗</div>
              <h2 className={styles.cardTitle}>Fuel Your Fitness</h2>
            </div>
            <Link href="/diet" className={styles.cardLink}>View All →</Link>
          </div>
          <p className={styles.cardSub}>Simple, balanced Indian nutrition for real gains</p>
          <div className={styles.nutritionBody}>
            <div className={styles.nutritionImgWrap}>
              <img
                className={styles.nutritionImg}
                src="/indian-nutrition.jpg"
                alt="High protein Indian thali"
              />
            </div>
            <div className={styles.nutritionBullets}>
              <div className={styles.nBullet}>
                <span className={styles.nCheck}>✓</span>
                <span>High Protein: Paneer, Soya, Sprouts, Daal</span>
              </div>
              <div className={styles.nBullet}>
                <span className={styles.nCheck}>✓</span>
                <span>Balanced &amp; Local: Millets, Curd, Veggies</span>
              </div>
              <div className={styles.nBullet}>
                <span className={styles.nCheck}>✓</span>
                <span>Easy to Follow &amp; Student-Friendly</span>
              </div>
            </div>
            <Link href="/diet" className={styles.nutritionBtn}>
              Explore Diet Plans <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM STRIP: WHY FITNESS MATTERS ═══ */}
      <section className={styles.bottomStrip}>
        <div className={styles.bottomLeft}>
          <span className={styles.bottomHeart}>❤️</span>
          <span className={styles.bottomTitle}>Why Fitness Matters</span>
        </div>
        <div className={styles.benefitsRow}>
          <div className={styles.benefitItem}>
            <span className={styles.benefitIcon}>🛡️</span>
            <span>Stronger Immunity</span>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitIcon}>⚡</span>
            <span>More Energy</span>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitIcon}>🧘</span>
            <span>Better Mental Health</span>
          </div>
          <div className={styles.benefitItem}>
            <span className={styles.benefitIcon}>👥</span>
            <span>A Healthier India</span>
          </div>
        </div>
        <div className={styles.bottomQuote}>
          &ldquo;A fitter you builds a stronger nation.&rdquo; &nbsp;🇮🇳
        </div>
      </section>
    </div>
  );
}
