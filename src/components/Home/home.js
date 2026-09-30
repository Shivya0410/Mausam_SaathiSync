"use client";

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../store/auth';
import { usePathname, useRouter } from 'next/navigation';
import Navbar from '../Navbar/navbar';
import { useTranslation } from "react-i18next";
import FitnessEventsMap from '../map/FitnessEventsMap';
import SampleDataBadge from '../shared/SampleDataBadge';
import GoogleAuthButton from '../auth/GoogleAuthButton';
import GovBanner from '../gov/GovBanner';
import { stashPendingGoogleProfile } from '../../services/googleAuth';
import { demoHomeStats } from '../../data/demoStats';
import './home.css';

export default function Homesection() {
  const { t } = useTranslation();
  const { isLoggedIN, isAuthReady, LogoutUser, storetokenInLS } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const activities = [
    {
      img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/467cf682-03fb-4fae-b129-5d4f5db304dd',
      title: 'Tennis',
      link: '/tennis'
    },
    {
      img: 'https://media.cnn.com/api/v1/images/stellar/prod/220531190304-woman-meditation-stock.jpg?q=w_1110,c_fill',
      title: 'Meditation',
      link: '/meditation'
    },
    {
      img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/c8e88356-8df5-4ac5-9e1f-5b9e99685021',
      title: 'Running'
    },
    {
      img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/69437d08-f203-4905-8cf5-05411cc28c19',
      title: 'Cycling'
    },
    {
      img: 'https://www.wfla.com/wp-content/uploads/sites/71/2023/04/GettyImages-828532530.jpg?w=2560&h=1440&crop=1',
      title: 'Climbing'
    },
    {
      img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/3bab6a71-c842-4a50-9fed-b4ce650cb478',
      title: 'Hiking'
    },
    {
      img: 'https://www.clistudios.com/wp-content/uploads/2021/06/Alyson-Stoner-the-first-step-Candids-10.10.20-2-scaled.jpg',
      title: 'Dancing'
    },
    {
      // Dummy placeholder (picsum seed) — the old ruralheritage hotlink was unreliable.
      img: 'https://picsum.photos/seed/swasth-garden/640/480',
      title: 'Gardening'
    },
    {
      img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/e1a66078-1927-4828-b793-15c403d06411',
      title: 'Yoga',
      link: '/yoga'
    },
    {
      img: 'https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/7568e0ff-edb5-43dd-bff5-aed405fc32d9',
      title: 'Swimming'
    }
  ];

  return (
    <main1 className="dashboard-main-container">
      {/* Left Sidebar in Curvy Ends Format */}
      <Navbar />

      {/* Main Content Section */}
      <section className="content">
        {/* Homepage login — hidden until auth is ready (no flash),
            hidden after login. Email sign-in only. */}
        {!isAuthReady ? (
          <div className="home-hero-login home-hero-skeleton" aria-hidden="true">
            <div>
              <h2>{t('home.welcomeTitle')}</h2>
              <p>{t('home.loadingSession')}</p>
            </div>
          </div>
        ) : !isLoggedIN ? (
          <div className="home-hero-login">
            <div>
              <h2>{t('home.welcomeTitle')}</h2>
              <p>{t('home.welcomeSub')}</p>
            </div>
            <div className="home-hero-actions">
              <div className="home-google-wrap">
                <GoogleAuthButton
                  mode="continue"
                  variant="hero"
                  onSuccess={(token) => storetokenInLS(token)}
                  onNeedsProfile={(pending) => {
                    stashPendingGoogleProfile(pending);
                    router.push(`/register?next=${encodeURIComponent(pathname || '/')}`);
                  }}
                  onError={() => {}}
                />
              </div>
              <Link href={`/login?next=${encodeURIComponent(pathname || '/')}`} className="home-email-btn">{t('home.emailBtn')}</Link>
            </div>
          </div>
        ) : null}
        {/* Government fitness missions — visible to everyone */}
        <GovBanner />
        {/* Left Content Area */}
        <div className="left-content">
          {/* Fitness Activities Gallery */}
          <div className="activities">
            <h1>{t('fitnessActivities')}</h1>
            <div className="activity-container">
              {activities.map((activity, index) => {
                const className = `image-container img-${index + 1}`;
                const contents = (
                  <>
                    <img
                      src={activity.img}
                      alt={t(`activities.${activity.title}`)}
                    />
                    <div className="overlay">
                      <h3>{t(`activities.${activity.title}`)}</h3>
                    </div>
                  </>
                );

                return activity.link ? (
                  <Link key={activity.title} href={activity.link} className={className}>
                    {contents}
                  </Link>
                ) : (
                  <div
                    key={activity.title}
                    className={className}
                    style={{ cursor: 'default' }}
                  >
                    {contents}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Left Bottom: Weekly Events Map & Sustain Count */}
          <div className="left-bottom">
            <div className="weekly-schedule">
              <h1>{t('globalFitnessEvents')}</h1>
              <div className="map-container-box">
                <FitnessEventsMap placeholder={t('fitnessEventsPlaceholder')} />
              </div>
            </div>

            <div className="personal-bests">
              <h1>
                {t('dailySustainCount')}
                <SampleDataBadge />
              </h1>
              <div className="personal-bests-container">
                <a
                  href="https://bmiappgit-t9k3jh22sjwktzyz4w7gju.streamlit.app/#health-risk-calculator"
                  target="_blank"
                  rel="noreferrer"
                  title="Calculate Health Risk AI"
                >
                  <div className="best-item box-one">
                    <p>{t('carbonFootprint', { value: demoHomeStats.carbonFootprint })}</p>
                    <img
                      src="https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/242bbd8c-aaf8-4aee-a3e4-e0df62d1ab27"
                      alt=""
                    />
                  </div>
                </a>

                <div className="best-item box-two">
                  <p>{t('dailyStepCount', { value: demoHomeStats.dailySteps })}</p>
                  <img
                    src="https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/a3b3cb3a-5127-498b-91cc-a1d39499164a"
                    alt=""
                  />
                </div>

                <div className="best-item box-three">
                  <p>{t('totalSustainPoints', { value: demoHomeStats.sustainPoints })}</p>
                  <img
                    src="https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/e0ee8ffb-faa8-462a-b44d-0a18c1d9604c"
                    alt=""
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="right-content">
          {/* User Info Bar — single login lives in the hero above; no duplicate pill here */}
          <div className="user-info">
            {isAuthReady && isLoggedIN ? (
              <div className="user-actions">
                <button
                  type="button"
                  className="home-logout-btn"
                  onClick={() => LogoutUser()}
                  title={t('nav.logout')}
                >
                  <i className="fa-solid fa-right-from-bracket"></i> {t('nav.logout')}
                </button>
                <Link href="/profile" title={t('home.viewProfile')}>
                  <img
                    src="https://akm-img-a-in.tosshub.com/indiatoday/images/story/202212/afp_000_9cq7ux_shilpa_shetty_yoga-one_one.jpg?VersionId=DeAg8M98aY9OSz3Z3gVSU84uySM4f245"
                    alt={t('home.avatarAlt')}
                  />
                </Link>
              </div>
            ) : null}
          </div>

          {/* Active Calories Circle Card */}
          <Link href="/calorie" style={{ textDecoration: 'none' }}>
            <div className="active-calories">
              <h1 style={{ alignSelf: 'flex-start' }}>
                {t('activeCalories')}
                <SampleDataBadge />
              </h1>
              <div className="active-calories-container">
                <div className="box" style={{ '--i': `${demoHomeStats.activeCaloriesPercent}%` }}>
                  <div className="circle">
                    <h2>
                      {demoHomeStats.activeCaloriesPercent}
                      <small>%</small>
                    </h2>
                  </div>
                </div>
                <div className="calories-content">
                  <p><span>{t('today')}:</span> {demoHomeStats.caloriesToday}</p>
                  <p><span>{t('thisWeek')}:</span> {demoHomeStats.caloriesThisWeek}</p>
                  <p><span>{t('thisMonth')}:</span> {demoHomeStats.caloriesThisMonth}</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Mobile Personal Bests */}
          <div className="mobile-personal-bests">
            <h1>
              {t('personalBests')}
              <SampleDataBadge />
            </h1>
            <div className="personal-bests-container">
              <div className="best-item box-one">
                <p>{t('fastest5KRun', { time: demoHomeStats.fastest5KRun })}</p>
                <img
                  src="https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/05dfc444-9ed3-44cc-96af-a9cf195f5820"
                  alt={t('fastest5KRunAlt')}
                />
              </div>
              <div className="best-item box-two">
                <p>{t('longestDistanceCycling', { distance: demoHomeStats.longestCyclingDistance })}</p>
                <img
                  src="https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/9ca170e9-1252-4fa6-8677-36493540c1f2"
                  alt={t('longestDistanceCyclingAlt')}
                />
              </div>
              <div className="best-item box-three">
                <p>{t('longestRollerSkating', { duration: demoHomeStats.longestRollerSkating })}</p>
                <img
                  src="https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/2a7e787c-c12b-49d2-b7fd-72d2c8a3a434"
                  alt={t('longestRollerSkatingAlt')}
                />
              </div>
            </div>
          </div>

          {/* Daily Fitness Blogs & Community Activity */}
          <div className="friends-activity">
            <h1>{t('dailyFitnessBlogs')}</h1>
            <div className="card1-container">
              <Link href="/blog1" style={{ textDecoration: 'none' }}>
                <div className="card1">
                  <div className="card1-user-info">
                    <img
                      src="https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/9290037d-a5b2-4f50-aea3-9f3f2b53b441"
                      alt=""
                    />
                    <h2>{t('jane')}</h2>
                  </div>
                  <img
                    className="card1-img"
                    src="https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/bef54506-ea45-4e42-a1b6-23a48f61c5e8"
                    alt=""
                  />
                  <p>{t('completedRunningChallenge')}</p>
                </div>
              </Link>

              <Link href="/blog2" style={{ textDecoration: 'none' }}>
                <div className="card1 card1-two">
                  <div className="card1-user-info">
                    <img
                      src="https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/42616ef2-ba96-49c7-80ea-c3cf1e2ecc89"
                      alt=""
                    />
                    <h2>{t('mike')}</h2>
                  </div>
                  <img
                    className="card1-img"
                    src="https://github.com/ecemgo/mini-samples-great-tricks/assets/13468728/2dcc1b94-06c5-4c62-b886-53b9e433fd44"
                    alt=""
                  />
                  <p>{t('setCyclingRecord')}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main1>
  );
}
