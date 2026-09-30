"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { WidgetShell, NotAvailable, scoreBand } from './shared';
import HourBand from '../charts/HourBand';
import { fmtHour, fmtTime, fmtTemp, fmtDate } from '../../lib/format';
import { runWindow } from '../../lib/mausam/rules/fitness';
import { topFactors } from '../../lib/mausam/indices/runScore';
import { eventConditions } from '../../lib/mausam/rules/events';
import { comfortIndex, comfortBand } from '../../lib/mausam/indices/comfortIndex';
import { daysBetween } from '../../lib/mausam/time';

/** Run Score cells for the next 36 hours with the user's settings. */
export function runCells(view, t, lang) {
  const w = runWindow(view.ctx);
  const cells = w.scored.map((h) => {
    const band = scoreBand(h.score, h.unsafe);
    return {
      key: h.time,
      hourLabel: fmtHour(h.time, lang),
      band,
      label: t('charts.runCell', {
        time: fmtHour(h.time, lang),
        score: h.score,
        band: t(`bands.${band}`),
        temp: fmtTemp(h.tempC),
        feels: fmtTemp(h.feelsC),
        why: topFactors(h.penalties).map((f) => t(`factors.${f}`)).join(', ') || t('factors.none'),
      }),
    };
  });
  return { w, cells };
}

// ── Best running hours (signature feature for fitness, PRD 3.3.2) ──
export function RunWindowWidget({ view, hero = false }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { w, cells } = runCells(view, t, lang);
  if (!cells.length) return <WidgetShell id="runWindow"><NotAvailable /></WidgetShell>;
  const highlight = w.none ? [] : w.hours.map((h) => h.time);
  const best = !w.none ? w.hours.reduce((a, b) => (b.score > a.score ? b : a)) : null;
  return (
    <WidgetShell id="runWindow" icon="fa-solid fa-person-running" more={hero ? null : { href: '/run', label: t('widgets.runWindow.more') }}>
      <p className="ms-widget-lead">
        {w.none
          ? t('widgets.runWindow.none')
          : t('widgets.runWindow.best', {
              start: fmtTime(w.start, lang),
              end: fmtTime(w.end, lang),
              score: w.score,
              activity: t(`activities.${w.settings.activity}`),
            })}
      </p>
      {w.outsideBand ? <p className="ms-muted">{t('widgets.runWindow.outsideBand')}</p> : null}
      {best ? (
        <p className="ms-muted">
          {t('widgets.runWindow.why', {
            temp: fmtTemp(best.tempC),
            feels: fmtTemp(best.feelsC),
            factors: topFactors(best.penalties).map((f) => t(`factors.${f}`)).join(', ') || t('factors.none'),
          })}
        </p>
      ) : null}
      <HourBand ariaLabel={t('widgets.runWindow.title')} cells={cells} highlight={highlight} />
    </WidgetShell>
  );
}

// ── Your event: countdown, comfort, rain, wind ──
export function EventComfortWidget({ view, env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const events = (env.personal?.events || []).filter((e) => e.date >= env.today);
  const next = events[0];
  if (!next) {
    return (
      <WidgetShell id="eventComfort" icon="fa-solid fa-champagne-glasses">
        <NotAvailable messageKey="empty.events" action={<Link href="/events">{t('widgets.eventComfort.add')}</Link>} />
      </WidgetShell>
    );
  }
  const inDays = daysBetween(env.today, next.date);
  const c = inDays <= 16 ? eventConditions(view.ctx, next) : null;
  const clim = env.personal?.climatology?.[next.id];
  const score = c ? comfortIndex(c) : null;
  return (
    <WidgetShell id="eventComfort" icon="fa-solid fa-champagne-glasses" more={{ href: '/events', label: t('widgets.eventComfort.more') }}>
      <p className="ms-widget-lead">
        {next.name} · {fmtDate(next.date, lang)} · {t('widgets.eventComfort.inDays', { count: inDays })}
      </p>
      {c ? (
        <dl className="ms-kv">
          <div><dt>{t('widgets.eventComfort.comfort')}</dt><dd>{score} · {t(`verdicts.comfort.${comfortBand(score)}`)}</dd></div>
          <div><dt>{t('charts.rainChance')}</dt><dd>{Math.round(c.precipProbMax)}%</dd></div>
          <div><dt>{t('widgets.wind.gustLabel')}</dt><dd>{Math.round(c.gustMax)} {t('units.kmh')}</dd></div>
        </dl>
      ) : clim ? (
        <p>{t('rules.events.climatology.headline', { n: clim.rainyYears, years: clim.yearsCounted })} · {t('rules.events.climatology.reason')}</p>
      ) : (
        <NotAvailable messageKey="widgets.eventComfort.beyond" />
      )}
      <p className="ms-muted">{t('widgets.eventComfort.slot', { slot: t(`slots.${next.slot || 'evening'}`) })}</p>
    </WidgetShell>
  );
}
