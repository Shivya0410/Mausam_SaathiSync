"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { heatBand } from '../../lib/mausam/indices/heatIndex';
import { fmtHour } from '../../lib/format';

/**
 * Frame for every widget: a titled section with a heading (screen readers
 * can jump between widgets by heading), optional source line and link.
 */
export function WidgetShell({ id, titleKey, icon, children, source, more, badge }) {
  const { t } = useTranslation();
  const headingId = `w-${id}`;
  return (
    <section className="ms-card ms-widget" aria-labelledby={headingId}>
      <div className="ms-widget-head">
        <h2 id={headingId}>
          {icon ? <i className={icon} aria-hidden="true"></i> : null} {t(titleKey || `widgets.${id}.title`)}
        </h2>
        {badge}
      </div>
      {children}
      {source || more ? (
        <div className="ms-widget-foot">
          {source ? <span className="ms-widget-source">{source}</span> : <span></span>}
          {more ? (
            <Link href={more.href} className="ms-link">
              {more.label} <i className="fa-solid fa-angle-right" aria-hidden="true"></i>
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** Honest empty state: data this place does not have (PRD edge case E9). */
export function NotAvailable({ messageKey = 'common.notAvailableHere', action }) {
  const { t } = useTranslation();
  return (
    <p className="ms-empty">
      <i className="fa-solid fa-circle-info" aria-hidden="true"></i> {t(messageKey)} {action}
    </p>
  );
}

/** Score (0 to 100, or unsafe) to a colour band shared by all hour bands. */
export function scoreBand(score, unsafe) {
  if (unsafe) return 'unsafe';
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/** Heat index band to the same colour scale. */
export const HEAT_BAND_CLASS = {
  comfortable: 'excellent',
  caution: 'good',
  extreme_caution: 'fair',
  danger: 'poor',
  extreme_danger: 'unsafe',
};

export function heatCell(h, t, lang) {
  const band = heatBand(h.feelsC) || 'comfortable';
  return {
    key: h.time,
    hourLabel: fmtHour(h.time, lang),
    band: HEAT_BAND_CLASS[band],
    label: t('charts.heatCell', { time: fmtHour(h.time, lang), hi: Math.round(h.feelsC), band: t(`heatBands.${band}`) }),
  };
}

/** Next `hours` hourly records from now. */
export function upcoming(view, hours) {
  return view.ctx.window(view.ctx.nowMs, hours);
}
