"use client";

import { useTranslation } from 'react-i18next';
import { WidgetShell, NotAvailable, scoreBand } from './shared';
import AqiDial from '../charts/AqiDial';
import HourBand from '../charts/HourBand';
import SampleDataBadge from '../shared/SampleDataBadge';
import { fmtHour, fmtTime, fmtDistance } from '../../lib/format';
import { scoreHour, outdoorComfortOpts, topFactors } from '../../lib/mausam/indices/runScore';
import { allergyEstimate } from '../../lib/mausam/indices/allergyEstimate';
import { bestTimeOut } from '../../lib/mausam/rules/health';
import { upcoming } from './shared';

// ── Air quality (National AQI) ──
export function AqiWidget({ env }) {
  const { t } = useTranslation();
  const air = env.snapshot.air;
  if (!air) return <WidgetShell id="aqi" icon="fa-solid fa-lungs"><NotAvailable /></WidgetShell>;
  const estimated = air.method !== 'cpcb';
  return (
    <WidgetShell
      id="aqi"
      icon="fa-solid fa-lungs"
      badge={air.method === 'fixture' ? <SampleDataBadge variant="demo" /> : estimated ? <SampleDataBadge variant="estimate" /> : null}
      source={
        air.method === 'cpcb'
          ? t('widgets.aqi.station', { name: air.stationName, km: air.stationDistanceKm })
          : t(`aqi.method.${air.method}`)
      }
      more={{ href: '/health', label: t('widgets.aqi.more') }}
    >
      <div className="ms-aqi-row">
        <AqiDial aqi={air.aqi} category={air.category} dominant={air.dominant} />
        <div>
          <p className={`ms-aqi-word ms-aqi--${air.category}`}>{t(`aqi.category.${air.category}`)}</p>
          <p className="ms-muted">
            {t('widgets.aqi.pm', { pm25: air.pm25 ?? '–', pm10: air.pm10 ?? '–' })}
          </p>
          <p>{t(`aqi.health.${air.category}`)}</p>
        </div>
      </div>
    </WidgetShell>
  );
}

/** Outdoor comfort cells for the next 24 hours (PRD 6.6.5). */
export function comfortCells(view, t, lang, hours = 24) {
  const opts = outdoorComfortOpts(view.ctx.sensitivities);
  return upcoming(view, hours).map((h) => {
    const s = scoreHour({ ...h, aqi: view.ctx.aqiOf(h) }, opts);
    const band = scoreBand(s.score, s.unsafe);
    return {
      key: h.time,
      hourLabel: fmtHour(h.time, lang),
      band,
      score: s.score,
      label: t('charts.scoreCell', {
        time: fmtHour(h.time, lang),
        score: s.score,
        band: t(`bands.${band}`),
        why: topFactors(s.penalties).map((f) => t(`factors.${f}`)).join(', '),
      }),
    };
  });
}

// ── Best time to step out ──
export function BestTimeOutWidget({ view }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const cells = comfortCells(view, t, lang);
  const best = bestTimeOut(view.ctx);
  const highlight = best ? best.hours.map((h) => h.time) : [];
  return (
    <WidgetShell id="bestTimeOut" icon="fa-solid fa-person-walking">
      <p className="ms-widget-lead">
        {best
          ? t('widgets.bestTimeOut.best', { start: fmtTime(best.start, lang), end: fmtTime(best.end, lang), score: best.score })
          : t('widgets.bestTimeOut.none')}
      </p>
      <HourBand ariaLabel={t('widgets.bestTimeOut.title')} cells={cells} highlight={highlight} />
    </WidgetShell>
  );
}

// ── Allergy risk (estimate, never presented as a pollen count) ──
export function AllergyEstimateWidget({ view, env }) {
  const { t } = useTranslation();
  const h = view.ctx.hourAt(view.ctx.nowMs);
  if (!h || !env.snapshot.air) return <WidgetShell id="allergyEstimate"><NotAvailable /></WidgetShell>;
  const est = allergyEstimate({
    month: view.ctx.local.month,
    pm10: env.snapshot.air.pm10 ?? 0,
    windKmh: h.windKmh,
    rh: h.rh,
    rainingNow: (h.precipMm ?? 0) >= 0.5,
  });
  return (
    <WidgetShell id="allergyEstimate" icon="fa-solid fa-seedling" badge={<SampleDataBadge variant="estimate" />}>
      <p className={`ms-stat-big ms-risk--${est.level}`}>{t(`risk.${est.level}`)}</p>
      <p className="ms-muted">{t('widgets.allergyEstimate.honest')}</p>
    </WidgetShell>
  );
}

// ── Cool spots nearby (public places, not confirmed cooling centres) ──
export function CoolSpotsWidget({ env }) {
  const { t, i18n } = useTranslation();
  const spots = env.coolSpots.slice(0, 3);
  return (
    <WidgetShell id="coolSpots" icon="fa-solid fa-snowflake" more={spots.length ? { href: '/work', label: t('widgets.coolSpots.more') } : null}>
      {spots.length ? (
        <ul className="ms-list">
          {spots.map((s) => (
            <li key={s.name}>
              <strong>{s.name}</strong> · {fmtDistance(s.distanceM, i18n.language)}
              <br />
              <span className="ms-muted">{t(`coolSpotTypes.${s.type}`)} · {t('widgets.coolSpots.publicPlace')}</span>
            </li>
          ))}
        </ul>
      ) : (
        <NotAvailable messageKey="widgets.coolSpots.none" />
      )}
    </WidgetShell>
  );
}
