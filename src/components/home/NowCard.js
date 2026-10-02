"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import WeatherIcon from '../shared/WeatherIcon';
import WeatherIllustration from './WeatherIllustration';
import WeatherMascot from './WeatherMascot';
import SourceBadge from '../shared/SourceBadge';
import SampleDataBadge from '../shared/SampleDataBadge';
import ListenButton from '../shared/ListenButton';
import LevelBadge from '../shared/LevelBadge';
import { fmtTemp, compassWord, fmtTime } from '../../lib/format';
import { compass8 } from '../../lib/mausam/geo';
import { officialStatus } from '../../lib/mausam/warnings';
import { levelName } from '../../lib/mausam/hazards';
import { uvCategory } from '../../lib/mausam/indices/uv';

/** Loading placeholder shaped like the card (PRD 16.3: no spinners). */
export function NowSkeleton() {
  const { t } = useTranslation();
  return (
    <section className="ms-card ms-now ms-now--loading" aria-busy="true">
      <span className="visually-hidden">{t('common.loading')}</span>
      <div className="ms-skeleton ms-skeleton--line" style={{ width: '40%', height: '24px', borderRadius: '12px' }}></div>
      <div className="ms-skeleton ms-skeleton--big" style={{ height: '140px', borderRadius: '20px', margin: '16px 0' }}></div>
      <div className="ms-skeleton ms-skeleton--line" style={{ width: '80%', height: '36px', borderRadius: '12px' }}></div>
    </section>
  );
}

/** Official status chip: never "No warnings" when they could not be checked. */
export function OfficialChip({ snapshot, now }) {
  const { t } = useTranslation();
  const s = officialStatus(snapshot, now);
  if (s.state === 'active') {
    const lvl = levelName(s.highest.level);
    return (
      <Link href="/alerts" className={`ms-status-chip ms-status-chip--${lvl}`}>
        <LevelBadge level={lvl} />
        <span className="ms-status-chip-text">
          {t(`hazards.${s.highest.hazard}`, { defaultValue: s.highest.title })}
          {s.count > 1 ? ` · ${t('alerts.moreCount', { count: s.count - 1 })}` : ''}
        </span>
      </Link>
    );
  }
  if (s.state === 'no_warnings') {
    return (
      <span className="ms-status-chip ms-status-chip--ok">
        <i className="fa-solid fa-shield-check" aria-hidden="true"></i> {t('levels.noWarnings')}
      </span>
    );
  }
  return (
    <Link href="/alerts" className="ms-status-chip ms-status-chip--unknown">
      <i className="fa-solid fa-circle-question" aria-hidden="true"></i>{' '}
      {t(s.state === 'not_applicable' ? 'levels.notApplicable' : 'levels.cannotCheck')}
    </Link>
  );
}

/**
 * Main Weather Hero Card (PRD 5.5, 20.3):
 * Visual centerpiece with dynamic weather backdrop, atmospheric animations,
 * high/low, feels-like, UV, AQI, wind compass, sunrise/sunset, and official IMD warnings.
 */
export default function NowCard({ snapshot, status, now, today, summary, onRetry, compact = false }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isHi = lang === 'hi';
  const highestWarning = useMemo(() => {
    if (!snapshot) return 1;
    const s = officialStatus(snapshot, now);
    return s.highest?.level || 1;
  }, [snapshot, now]);

  if (!snapshot) {
    if (status === 'error') {
      return (
        <section className="ms-card ms-now ms-now--error" role="alert">
          <div className="ms-error-state">
            <i className="fa-solid fa-triangle-exclamation ms-error-icon" aria-hidden="true"></i>
            <p>{t('errors.weatherUnavailable')}</p>
            <button type="button" className="ms-btn ms-btn--primary" onClick={onRetry}>
              <i className="fa-solid fa-rotate-right" aria-hidden="true"></i> {t('common.retry')}
            </button>
          </div>
        </section>
      );
    }
    return <NowSkeleton />;
  }

  const c = snapshot.current || {};
  const day = snapshot.daily?.find((d) => d.date === today) || snapshot.daily?.[0];
  const air = snapshot.air;
  const sun = snapshot.sun || {};
  const placeName = isHi && snapshot.place?.nameHi ? snapshot.place.nameHi : (snapshot.place?.name || 'India');
  const dir = compass8(c.windDirDeg);
  const hotter = Number.isFinite(c.feelsC) && Number.isFinite(c.tempC) && c.feelsC - c.tempC >= 4;

  const speech = () =>
    [
      summary,
      t('now.speech', {
        place: placeName,
        cond: t(`wmo.${c.wmo}`),
        temp: Math.round(c.tempC),
        feels: Math.round(c.feelsC),
        hi: Math.round(day?.maxC),
        lo: Math.round(day?.minC),
      }),
    ]
      .filter(Boolean)
      .join('. ');

  const currentUv = c.uv != null ? Math.round(c.uv) : day?.uvMax != null ? Math.round(day.uvMax) : null;
  const uvCat = currentUv != null ? uvCategory(currentUv) : null;

  return (
    <section className={`ms-card ms-now ms-hero-card ${compact ? 'ms-now--compact' : ''}`} aria-labelledby="now-title">
      <h2 id="now-title" className="visually-hidden">
        {t('now.heading', { place: placeName })}
      </h2>

      {/* Card Header row */}
      <div className="ms-now-top">
        <div className="ms-now-loc-badge">
          <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
          <span className="ms-loc-name">{placeName}</span>
          {snapshot.place?.state ? <span className="ms-loc-state">, {snapshot.place.state}</span> : null}
        </div>

        <div className="ms-now-top-actions">
          {snapshot.isDemo ? (
            <SampleDataBadge variant="demo" />
          ) : status === 'offline' ? (
            <SampleDataBadge variant="stale" label={t('common.offline', { time: fmtTime(c.updatedAt, lang) })} />
          ) : null}
          {!compact && (
            <div className="ms-hero-listen">
              <ListenButton text={speech} compact label={t('home.listenSummary')} />
            </div>
          )}
        </div>
      </div>

      {/* Main Temperature & Condition showcase */}
      <div className="ms-now-main">
        <div className="ms-now-temp-wrap">
          <div className="ms-now-temp-primary">
            <span className="ms-now-temp-value" aria-hidden="true">{fmtTemp(c.tempC)}</span>
            <span className="visually-hidden">{t('now.tempAria', { temp: fmtTemp(c.tempC), feels: fmtTemp(c.feelsC) })}</span>
          </div>

          <div className="ms-now-side-info">
            <div className="ms-now-cond-pill">
              <WeatherIcon code={c.wmo} isDay={c.isDay} size={compact ? 24 : 32} />
              <span className="ms-now-cond-text">{t(`wmo.${c.wmo}`)}</span>
            </div>

            <div className="ms-now-feels-row">
              <span className="ms-feels-label">{t('now.feelsLike')}</span>
              <span className="ms-feels-val">{fmtTemp(c.feelsC)}</span>
            </div>

            {day ? (
              <div className="ms-now-hl-row">
                <span className="ms-hl-high"><i className="fa-solid fa-arrow-up" aria-hidden="true"></i> {fmtTemp(day.maxC)}</span>
                <span className="ms-hl-divider">·</span>
                <span className="ms-hl-low"><i className="fa-solid fa-arrow-down" aria-hidden="true"></i> {fmtTemp(day.minC)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {hotter ? (
        <div className="ms-now-why-box">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
          <span>{t('now.whyHotter')}</span>
        </div>
      ) : null}

      {/* Dynamic Key Metric Cards */}
      {!compact && (
        <div className="ms-now-metrics-grid">
          {/* Humidity */}
          <div className="ms-metric-pill">
            <div className="ms-metric-icon ms-metric-icon--rain">
              <i className="fa-solid fa-droplet" aria-hidden="true"></i>
            </div>
            <div className="ms-metric-info">
              <span className="ms-metric-label">{t('now.humidity')}</span>
              <strong className="ms-metric-val">{c.rh ?? '--'}%</strong>
            </div>
          </div>

          {/* Wind */}
          <div className="ms-metric-pill">
            <div className="ms-metric-icon ms-metric-icon--wind">
              <i
                className="fa-solid fa-location-arrow"
                style={{ transform: `rotate(${((c.windDirDeg ?? 0) + 135) % 360}deg)` }}
                aria-hidden="true"
              ></i>
            </div>
            <div className="ms-metric-info">
              <span className="ms-metric-label">{t('widgets.wind.title')}</span>
              <strong className="ms-metric-val">
                {Math.round(c.windKmh ?? 0)} <span className="ms-metric-unit">km/h {compassWord(dir, lang)}</span>
              </strong>
            </div>
          </div>

          {/* Air Quality (AQI) */}
          {air ? (
            <div className="ms-metric-pill">
              <div className={`ms-metric-icon ms-metric-icon--aqi ms-aqi-bg--${air.category}`}>
                <i className="fa-solid fa-wind" aria-hidden="true"></i>
              </div>
              <div className="ms-metric-info">
                <span className="ms-metric-label">AQI ({t(`aqi.category.${air.category}`)})</span>
                <strong className="ms-metric-val">
                  <span className={`ms-aqi-indicator ms-dot--${air.category}`} aria-hidden="true"></span>
                  {air.aqi}
                </strong>
              </div>
            </div>
          ) : null}

          {/* UV Index */}
          {currentUv != null ? (
            <div className="ms-metric-pill">
              <div className="ms-metric-icon ms-metric-icon--uv">
                <i className="fa-solid fa-sun" aria-hidden="true"></i>
              </div>
              <div className="ms-metric-info">
                <span className="ms-metric-label">{t('widgets.uv.title')}</span>
                <strong className="ms-metric-val">
                  {currentUv} <span className="ms-metric-unit">({uvCat ? t(`uv.category.${uvCat}`) : ''})</span>
                </strong>
              </div>
            </div>
          ) : null}

          {/* Sunrise / Sunset */}
          {sun.sunrise || day?.sunrise ? (
            <div className="ms-metric-pill">
              <div className="ms-metric-icon ms-metric-icon--sun">
                <i className="fa-solid fa-sun-plant-wilt" aria-hidden="true"></i>
              </div>
              <div className="ms-metric-info">
                <span className="ms-metric-label">{isHi ? 'सूर्योदय / सूर्यास्त' : 'Sun Times'}</span>
                <strong className="ms-metric-val ms-sun-times">
                  <span>🌅 {fmtTime(sun.sunrise || day.sunrise, lang)}</span>
                  <span>🌇 {fmtTime(sun.sunset || day.sunset, lang)}</span>
                </strong>
              </div>
            </div>
          ) : null}

          {/* Rain Probability today */}
          {day?.precipProbMax != null ? (
            <div className="ms-metric-pill">
              <div className="ms-metric-icon ms-metric-icon--rain">
                <i className="fa-solid fa-cloud-rain" aria-hidden="true"></i>
              </div>
              <div className="ms-metric-info">
                <span className="ms-metric-label">{isHi ? 'बारिश की संभावना' : 'Rain Chance'}</span>
                <strong className="ms-metric-val">{day.precipProbMax}% {day.precipMm ? `(${day.precipMm} mm)` : ''}</strong>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Google Weather Inspired Animated Mascot Panorama */}
      {!compact && (
        <WeatherMascot
          wmo={c.wmo}
          isDay={c.isDay}
          tempC={c.tempC}
          feelsC={c.feelsC}
          aqi={air?.aqi || 50}
          warningLevel={highestWarning}
          placeName={placeName}
        />
      )}

      {/* Card Footer row */}
      <div className="ms-now-foot">
        <OfficialChip snapshot={snapshot} now={now} />
        <SourceBadge sources={snapshot.sources} updatedAt={c.updatedAt} now={now} />
      </div>
    </section>
  );
}
