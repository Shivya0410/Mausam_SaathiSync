"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { NEARBY_CENTRES } from './nearbyCentres';
import PageHeader from '../layout/PageHeader';
import './WellnessHub.css';

// Leaflet touches `window` at import time — keep it out of SSR like the
// fitness map does.
const ClinicMap = dynamic(() => import('./ClinicMap'), {
  ssr: false,
  loading: () => <div className="clinic-map clinic-map-loading">Loading map…</div>,
});

const DOSHAS = [
  { id: 'vata', icon: 'fa-solid fa-wind', img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=60' },
  { id: 'pitta', icon: 'fa-solid fa-fire', img: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=60' },
  { id: 'kapha', icon: 'fa-solid fa-mountain', img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=60' },
];

const DINACHARYA = [
  { id: 'rise', icon: 'fa-solid fa-sun' },
  { id: 'water', icon: 'fa-solid fa-mug-saucer' },
  { id: 'abhyanga', icon: 'fa-solid fa-hands' },
  { id: 'meals', icon: 'fa-solid fa-bowl-food' },
  { id: 'sleep', icon: 'fa-solid fa-moon' },
];

const BREATH_PHASES = [
  { id: 'inhale', labelKey: 'wellness.breathIn', secs: 4 },
  { id: 'hold', labelKey: 'wellness.breathHold', secs: 7 },
  { id: 'exhale', labelKey: 'wellness.breathOut', secs: 8 },
];

function BreathWidget() {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [left, setLeft] = useState(BREATH_PHASES[0].secs);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!running) return;
    if (left > 1) {
      const t = setTimeout(() => setLeft((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setPhaseIdx((i) => {
        const next = (i + 1) % BREATH_PHASES.length;
        if (next === 0) setCycles((c) => c + 1);
        setLeft(BREATH_PHASES[next].secs);
        return next;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [running, left]);

  const phase = BREATH_PHASES[phaseIdx];
  const reset = () => {
    setRunning(false);
    setPhaseIdx(0);
    setLeft(BREATH_PHASES[0].secs);
    setCycles(0);
  };

  return (
    <div className="breath-widget">
      <div
        className={`breath-circle breath-${phase.id} ${running ? 'breath-live' : ''}`}
        style={{ '--phase-secs': `${phase.secs}s` }}
        aria-hidden="true"
      >
        <span>{running ? left : '4·7·8'}</span>
      </div>
      <div className="breath-info">
        <strong>{running ? t(phase.labelKey) : t('wellness.breathTitle')}</strong>
        <p>{running ? t('wellness.breathCycles', { count: cycles }) : t('wellness.breathPattern')}</p>
        <div className="breath-actions">
          <button type="button" onClick={() => setRunning((r) => !r)} className="breath-btn">
            {running ? t('wellness.pause') : t('wellness.begin')}
          </button>
          <button type="button" onClick={reset} className="breath-btn breath-ghost">
            {t('wellness.reset')}
          </button>
        </div>
      </div>
    </div>
  );
}

// showHero=false when composed under work-sih's Wellness hero on /wellness,
// so the page has a single hero (theirs) followed by these hub sections.
export default function WellnessHub({ showHero = true }) {
  const { t } = useTranslation();
  const TIPS = [
    { icon: 'fa-solid fa-notes-medical', titleKey: 'wellness.tip1t', textKey: 'wellness.tip1x' },
    { icon: 'fa-solid fa-person-walking', titleKey: 'wellness.tip2t', textKey: 'wellness.tip2x' },
    { icon: 'fa-solid fa-users', titleKey: 'wellness.tip3t', textKey: 'wellness.tip3x' },
  ];

  return (
    <div className="wellness-page">
      {showHero && (
        <PageHeader
          title={t('wellness.title')}
          subtitle={t('wellness.subtitle')}
          chipIcon="fa-solid fa-circle-info"
          chipText={t('wellness.guidanceChip')}
        />
      )}

      {/* 1 · AYURVEDA — the hero focus, with photos */}
      <section className="well-section ayur-section" aria-label={t('wellness.ayurveda')}>
        <h2><i className="fa-solid fa-spa"></i> {t('wellness.ayurveda')} <span className="well-tag">{t('wellness.focusTag')}</span></h2>
        <p className="well-lead">{t('wellness.ayurvedaLead')}</p>
        <div className="dosha-grid">
          {DOSHAS.map((d) => (
            <article key={d.id} className="glass-card dosha-card dosha-photo-card">
              <div className="dosha-photo">
                <img src={d.img} alt={t(`wellness.dosha_${d.id}_name`)} loading="lazy" />
                <span className="dosha-icon dosha-icon-float"><i className={d.icon}></i></span>
              </div>
              <div className="dosha-body">
                <h3>{t(`wellness.dosha_${d.id}_name`)}</h3>
                <small>{t(`wellness.dosha_${d.id}_el`)}</small>
                <p>{t(`wellness.dosha_${d.id}_traits`)}</p>
                <p className="dosha-balance"><strong>{t('wellness.toBalance')}</strong> {t(`wellness.dosha_${d.id}_bal`)}</p>
              </div>
            </article>
          ))}
        </div>

        <h3 className="well-sub">{t('wellness.dinaTitle')}</h3>
        <div className="dina-strip dina-compact">
          {DINACHARYA.map((d) => (
            <div key={d.id} className="glass-card dina-card">
              <i className={d.icon}></i>
              <strong>{t(`wellness.dina_${d.id}_t`)}</strong>
              <span>{t(`wellness.dina_${d.id}_x`)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2 · FIND CLINICS — near you only: live map + nearby centres */}
      <section className="well-section clinic-section" aria-label={t('wellness.clinics')}>
        <h2><i className="fa-solid fa-hospital"></i> Find clinics <span className="well-tag">near you only</span></h2>
        <p className="well-lead">{t('wellness.clinicsLead')}</p>
        <div className="clinic-split">
          <ClinicMap />
          <div className="near-list">
            <h3 className="well-sub near-title"><i className="fa-solid fa-location-crosshairs"></i> Near you</h3>
            {NEARBY_CENTRES.map((c) => (
              <article key={c.id} className="glass-card near-card">
                <div className="near-top">
                  <h4>{c.name}</h4>
                  <span className="near-dist">{c.dist}</span>
                </div>
                <p className="clinic-focus">{c.kind}</p>
                <p className="clinic-meta"><i className="fa-solid fa-location-dot"></i> {c.area}</p>
                <p className="clinic-meta"><i className="fa-solid fa-clock"></i> {c.hours}</p>
                <a
                  className="near-dir"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get directions →
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MENTAL HEALTH */}
      <section className="well-section" aria-label={t('wellness.mental')}>
        <h2><i className="fa-solid fa-brain"></i> {t('wellness.mental')}</h2>
        <div className="mental-grid">
          <article className="glass-card">
            <h3>{t('wellness.calmTitle')}</h3>
            <BreathWidget />
          </article>
          <article className="glass-card helpline-card">
            <h3><i className="fa-solid fa-phone"></i> {t('wellness.helplineTitle')}</h3>
            <p className="helpline-num">Tele MANAS · 14416</p>
            <p>{t('wellness.helplineText')}</p>
          </article>
        </div>
        <div className="tips-row">
          {TIPS.map((tip) => (
            <div key={tip.titleKey} className="glass-card tip-card">
              <i className={tip.icon}></i>
              <strong>{t(tip.titleKey)}</strong>
              <span>{t(tip.textKey)}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="well-disclaimer">{t('wellness.disclaimer')}</footer>
    </div>
  );
}
