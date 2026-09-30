"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import WeatherIcon from '../shared/WeatherIcon';
import SourceBadge from '../shared/SourceBadge';
import SampleDataBadge from '../shared/SampleDataBadge';
import ListenButton from '../shared/ListenButton';
import LevelBadge from '../shared/LevelBadge';
import { fmtTemp, compassWord, fmtTime } from '../../lib/format';
import { compass8 } from '../../lib/mausam/geo';
import { officialStatus } from '../../lib/mausam/warnings';
import { levelName } from '../../lib/mausam/hazards';

/** Loading placeholder shaped like the card (PRD 16.3: no spinners). */
export function NowSkeleton() {
  const { t } = useTranslation();
  return (
    <section className="ms-card ms-now ms-now--loading" aria-busy="true">
      <span className="visually-hidden">{t('common.loading')}</span>
      <div className="ms-skeleton ms-skeleton--line"></div>
      <div className="ms-skeleton ms-skeleton--big"></div>
      <div className="ms-skeleton ms-skeleton--line"></div>
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
        <LevelBadge level={lvl} /> {t(`hazards.${s.highest.hazard}`, { defaultValue: s.highest.title })}
        {s.count > 1 ? ` · ${t('alerts.moreCount', { count: s.count - 1 })}` : ''}
      </Link>
    );
  }
  if (s.state === 'no_warnings') {
    return (
      <span className="ms-status-chip ms-status-chip--ok">
        <i className="fa-solid fa-circle-check" aria-hidden="true"></i> {t('levels.noWarnings')}
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
 * Now card (PRD 5.5, 20.3): condition, temperature, feels like, high/low,
 * humidity, wind, AQI, official status, source and time, Listen.
 */
export default function NowCard({ snapshot, status, now, today, summary, onRetry, compact = false }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  if (!snapshot) {
    if (status === 'error') {
      return (
        <section className="ms-card ms-now" role="alert">
          <p>{t('errors.weatherUnavailable')}</p>
          <button type="button" className="ms-btn" onClick={onRetry}>
            {t('common.retry')}
          </button>
        </section>
      );
    }
    return <NowSkeleton />;
  }
  const c = snapshot.current || {};
  const day = snapshot.daily?.find((d) => d.date === today) || snapshot.daily?.[0];
  const air = snapshot.air;
  const placeName = lang === 'hi' && snapshot.place?.nameHi ? snapshot.place.nameHi : snapshot.place?.name;
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
  return (
    <section className={`ms-card ms-now ${compact ? 'ms-now--compact' : ''}`} aria-labelledby="now-title">
      <h2 id="now-title" className="visually-hidden">
        {t('now.heading', { place: placeName })}
      </h2>
      <div className="ms-now-top">
        <span className="ms-now-cond">
          <WeatherIcon code={c.wmo} isDay={c.isDay} size={compact ? 32 : 44} />
          <span>{t(`wmo.${c.wmo}`)}</span>
        </span>
        {snapshot.isDemo ? <SampleDataBadge variant="demo" /> : status === 'offline' ? <SampleDataBadge variant="stale" label={t('common.offline', { time: fmtTime(c.updatedAt, lang) })} /> : null}
      </div>
      <div className="ms-now-main">
        <p className="ms-now-temp">
          <span aria-hidden="true">{fmtTemp(c.tempC)}</span>
          <span className="visually-hidden">{t('now.tempAria', { temp: fmtTemp(c.tempC), feels: fmtTemp(c.feelsC) })}</span>
        </p>
        <div className="ms-now-side">
          <p>
            {t('now.feelsLike')} <strong>{fmtTemp(c.feelsC)}</strong>
          </p>
          {day ? (
            <p>
              {t('now.high')} {fmtTemp(day.maxC)} · {t('now.low')} {fmtTemp(day.minC)}
            </p>
          ) : null}
        </div>
      </div>
      {hotter ? <p className="ms-muted ms-now-why">{t('now.whyHotter')}</p> : null}
      {!compact ? (
        <ul className="ms-now-chips">
          <li className="ms-chip">
            <i className="fa-solid fa-droplet" aria-hidden="true"></i> {t('now.humidity')} {c.rh}%
          </li>
          <li className="ms-chip">
            <i className="fa-solid fa-location-arrow" style={{ transform: `rotate(${((c.windDirDeg ?? 0) + 135) % 360}deg)` }} aria-hidden="true"></i>{' '}
            {t('now.wind', { speed: Math.round(c.windKmh ?? 0), dir: compassWord(dir, lang) })}
          </li>
          {air ? (
            <li className="ms-chip">
              <span className={`ms-dot ms-dot--${air.category}`} aria-hidden="true"></span> {t('now.aqi', { aqi: air.aqi, category: t(`aqi.category.${air.category}`) })}
            </li>
          ) : null}
        </ul>
      ) : null}
      <div className="ms-now-foot">
        <OfficialChip snapshot={snapshot} now={now} />
        <SourceBadge sources={snapshot.sources} updatedAt={c.updatedAt} now={now} />
        {!compact ? <ListenButton text={speech} /> : null}
      </div>
    </section>
  );
}
