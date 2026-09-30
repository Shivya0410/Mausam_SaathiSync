"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../store/auth';
import Link from 'next/link';
import Calendar from "../../components/calendar/Calendar";
import ProgressBar from "../../components/progress/ProgressBar";
import BadgesGrid from "../../components/badges/BadgesGrid";
import PageHeader from "../../components/layout/PageHeader";
import SampleDataBadge from "../../components/shared/SampleDataBadge";
import WhatsAppFloat from "../../components/shared/WhatsAppFloat";
import { loadForUser, saveForUser } from "../../utils/userScopedStorage";
import { awardBadges, BADGE_DEFS } from "../../utils/badges";
import './Tracker.css';

const STORE_KEY = 'swasth.tracker.v1';
const monthId = (y, m) => `${y}-${m}`;

export default function Tracker() {
  const { t, i18n } = useTranslation();
  // All months' data for this user: { "2026-9": { day: { Y, M, E, C } } }
  const [allMonths, setAllMonths] = useState({});
  const [freshBadges, setFreshBadges] = useState([]);
  const { isLoggedIN, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  // Load this user's data (and only theirs) when identity resolves.
  useEffect(() => {
    setAllMonths(loadForUser(STORE_KEY, user, {}));
    setFreshBadges([]);
  }, [user, isLoggedIN]);

  const persist = (next) => {
    setAllMonths(next);
    if (isLoggedIN) saveForUser(STORE_KEY, user, next);
  };

  const activityCounts = allMonths[monthId(viewYear, viewMonth)] || {};

  const handleActivitySelect = (day, activity, isChecked) => {
    if (!isLoggedIN) {
      router.push(`/login?next=${encodeURIComponent(pathname || '/tracker')}`);
      return;
    }
    const id = monthId(viewYear, viewMonth);
    const month = { ...(allMonths[id] || {}) };
    const entry = { ...(month[day] || {}) };
    if (isChecked) entry[activity] = true;
    else {
      delete entry[activity];
    }
    if (Object.keys(entry).length === 0) delete month[day];
    else month[day] = entry;
    const next = { ...allMonths, [id]: month };
    persist(next);

    // Gamification: award on meaningful moments.
    const earned = [];
    if (isChecked) {
      earned.push('first_step');
      const done = Object.values(entry).filter(Boolean).length;
      if (done === 4) earned.push('perfect_day');
      if (new Date().getHours() < 9) earned.push('early_bird');
    }
    const perfectDays = Object.values(month).filter(
      (d) => Object.values(d).filter(Boolean).length === 4
    ).length;
    if (perfectDays >= 7) earned.push('week_warrior');
    if (perfectDays >= 20) earned.push('month_master');
    if (earned.length) {
      const fresh = awardBadges(user, earned);
      if (fresh.length) setFreshBadges(fresh);
    }
  };

  const shiftMonth = (delta) => {
    let y = viewYear;
    let m = viewMonth + delta;
    while (m < 1) { m += 12; y -= 1; }
    while (m > 12) { m -= 12; y += 1; }
    setViewYear(y);
    setViewMonth(m);
  };

  const goToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
  };

  const locale = i18n?.language?.startsWith('hi') ? 'hi-IN' : 'en-US';

  const summary = useMemo(() => {
    const entries = Object.entries(activityCounts);
    const activeDays = entries.length;
    const perfectDays = entries.filter(([, d]) => Object.values(d).filter(Boolean).length === 4).length;
    const totalChecks = entries.reduce((n, [, d]) => n + Object.values(d).filter(Boolean).length, 0);
    const perPillar = { Y: 0, M: 0, E: 0, C: 0 };
    entries.forEach(([, d]) => Object.keys(perPillar).forEach((k) => { if (d[k]) perPillar[k]++; }));
    let bestDay = null;
    let bestScore = -1;
    entries.forEach(([day, d]) => {
      const s = Object.values(d).filter(Boolean).length;
      if (s > bestScore) { bestScore = s; bestDay = day; }
    });
    return { activeDays, perfectDays, totalChecks, perPillar, bestDay, bestScore };
  }, [activityCounts]);

  // Last-month summary for the side panel: the calendar month immediately
  // before the viewed one, from this user's stored data. Empty months show
  // clearly-labelled dummy figures (same SampleDataBadge convention as Home).
  const DUMMY_LAST = { activeDays: 18, perfectDays: 9, totalChecks: 54, topCode: 'Y', topN: 14 };
  const lastSummary = useMemo(() => {
    let y = viewYear;
    let m = viewMonth - 1;
    if (m < 1) { m = 12; y -= 1; }
    const data = allMonths[monthId(y, m)] || {};
    const entries = Object.entries(data);
    const activeDays = entries.length;
    const perfectDays = entries.filter(([, d]) => Object.values(d).filter(Boolean).length === 4).length;
    const totalChecks = entries.reduce((n, [, d]) => n + Object.values(d).filter(Boolean).length, 0);
    const perPillar = { Y: 0, M: 0, E: 0, C: 0 };
    entries.forEach(([, d]) => Object.keys(perPillar).forEach((k) => { if (d[k]) perPillar[k]++; }));
    const topEntry = Object.entries(perPillar).sort((a, b) => b[1] - a[1])[0];
    const label = new Date(y, m - 1, 1).toLocaleString(locale, { month: 'long', year: 'numeric' });
    if (activeDays === 0) return { label, ...DUMMY_LAST, isDummy: true };
    return { label, activeDays, perfectDays, totalChecks, topCode: topEntry[0], topN: topEntry[1], isDummy: false };
  }, [allMonths, viewYear, viewMonth, locale]);

  const daysInView = new Date(viewYear, viewMonth, 0).getDate();
  const pct = (code) => {
    const n = Object.values(activityCounts).filter((d) => d[code]).length;
    return ((n / daysInView) * 100).toFixed(2);
  };

  const pillars = [
    { code: 'Y', labelKey: 'pillars.yoga', label: t('pillars.yoga'), icon: 'fa-solid fa-person-praying', pct: pct('Y') },
    { code: 'M', labelKey: 'pillars.meditation', label: t('pillars.meditation'), icon: 'fa-solid fa-brain', pct: pct('M') },
    { code: 'E', labelKey: 'pillars.diet', label: t('pillars.diet'), icon: 'fa-solid fa-apple-whole', pct: pct('E') },
    { code: 'C', labelKey: 'pillars.creative', label: t('pillars.creative'), icon: 'fa-solid fa-pen-nib', pct: pct('C') },
  ];

  return (
    <div className="tracker-weboox">
      <PageHeader title={t('tracker.title')} subtitle={t('tracker.footer')} />
      {!isLoggedIN && (
        <div className="tracker-login-banner">
          <span><i className="fa-solid fa-lock"></i> {t('tracker.loginBanner')}</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href={`/login?next=${encodeURIComponent(pathname || '/tracker')}`} className="tracker-login-link">{t('tracker.emailLogin')}</Link>
          </div>
        </div>
      )}

      {freshBadges.length > 0 && (
        <div className="tracker-badge-toast" role="status" aria-live="polite">
          🎉 {t('badges.newUnlocked')}: {freshBadges.map((id) => t(BADGE_DEFS[id]?.nameKey || '')).join(', ')}
        </div>
      )}

      <div className="weboox-top">
        <div className="weboox-gauges">
          <ProgressBar activityCounts={activityCounts} />
        </div>

        <aside className="pillar-panel lastmonth-panel">
          <h2>{t('tracker.lastMonth')} {lastSummary.isDummy && <SampleDataBadge />}</h2>
          <div className="pillar-date">{lastSummary.label}</div>
          <div className="lastmonth-rows">
            <div className="lastmonth-row">
              <span><i className="fa-solid fa-calendar-check"></i> {t('tracker.activeDays')}</span>
              <strong>{lastSummary.activeDays}</strong>
            </div>
            <div className="lastmonth-row">
              <span><i className="fa-solid fa-star"></i> {t('tracker.perfectDays')}</span>
              <strong>{lastSummary.perfectDays}</strong>
            </div>
            <div className="lastmonth-row">
              <span><i className="fa-solid fa-list-check"></i> {t('tracker.totalChecks')}</span>
              <strong>{lastSummary.totalChecks}</strong>
            </div>
            <div className="lastmonth-row">
              <span><i className="fa-solid fa-trophy"></i> {t('tracker.topPillar', { defaultValue: 'Top pillar' })}</span>
              <strong>{t(pillars.find((p) => p.code === lastSummary.topCode)?.labelKey || 'pillars.yoga')} ({lastSummary.topN})</strong>
            </div>
          </div>
        </aside>
      </div>

      {/* Monthly summary — gamified stats for the viewed month */}
      <section className="tracker-summary" aria-label={t('tracker.summaryTitle')}>
        <h2>{t('tracker.summaryTitle')}</h2>
        <div className="tracker-summary-grid">
          <div className="tracker-stat"><strong>{summary.activeDays}</strong><span>{t('tracker.activeDays')}</span></div>
          <div className="tracker-stat"><strong>{summary.perfectDays}</strong><span>{t('tracker.perfectDays')}</span></div>
          <div className="tracker-stat"><strong>{summary.totalChecks}</strong><span>{t('tracker.totalChecks')}</span></div>
          <div className="tracker-stat">
            <strong>{summary.bestDay ?? '—'}</strong>
            <span>{t('tracker.bestDay')}{summary.bestDay ? ` (${summary.bestScore}/4)` : ''}</span>
          </div>
        </div>
      </section>

      <Calendar
        activityCounts={activityCounts}
        onActivitySelect={handleActivitySelect}
        year={viewYear}
        month={viewMonth}
        onPrevMonth={() => shiftMonth(-1)}
        onNextMonth={() => shiftMonth(1)}
        onGoToday={goToday}
      />

      {isLoggedIN && <BadgesGrid user={user} fresh={freshBadges} />}

      <div className="weboox-footer">
        <span className="weboox-footer-text">{t('tracker.footer')}</span>
        <WhatsAppFloat inline />
      </div>
    </div>
  );
}
