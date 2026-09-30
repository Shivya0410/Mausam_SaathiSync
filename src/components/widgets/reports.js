"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { WidgetShell, NotAvailable } from './shared';
import SampleDataBadge from '../shared/SampleDataBadge';
import { reportArea } from '../reports/ReportCard';
import { isTrusted, isActive, minutesAgo } from '../../lib/mausam/reports';

/** Trusted waterlogging reports nearby (PRD 5.8, 11.2). */
export function WaterloggingWidget({ view, env }) {
  const { t } = useTranslation();
  const now = view.ctx.nowMs;
  const list = view.ctx.reports
    .filter((r) => r.type === 'waterlogging' && isActive(r, now) && isTrusted(r))
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, 4);
  const demo = list.some((r) => r.demo);
  return (
    <WidgetShell
      id="waterlogging"
      icon="fa-solid fa-water"
      badge={demo ? <SampleDataBadge variant="demo" /> : null}
      more={{ href: '/reports', label: t('widgets.waterlogging.more') }}
      source={t('widgets.waterlogging.source')}
    >
      {list.length ? (
        <ul className="ms-list ms-list--plain">
          {list.map((r) => (
            <li key={r.id} className="ms-row">
              <span>
                <strong>{reportArea(r, env.personal?.places || [], t)}</strong> · {t(`severity.${r.severity || 1}`)}
              </span>
              <span className="ms-muted">
                {t('reports.minutesAgo', { minutes: minutesAgo(r, now) })} · {t('reports.confirmed', { count: r.confirmations || 0 })}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <NotAvailable messageKey="widgets.waterlogging.none" />
      )}
      <p>
        <Link href="/report" className="ms-link">{t('reports.reportWater')}</Link>
      </p>
    </WidgetShell>
  );
}

/**
 * Home teaser (PRD 5.2 item 12): shown in the monsoon or when reports exist
 * nearby. One line and a link, so it costs little space.
 */
export function ReportsTeaser({ reports, season, now }) {
  const { t } = useTranslation();
  if (!now) return null;
  const active = reports.filter((r) => isActive(r, now));
  if (!active.length && season !== 'monsoon') return null;
  const water = active.filter((r) => r.type === 'waterlogging').length;
  return (
    <section className="ms-card ms-teaser" aria-labelledby="reports-teaser">
      <h2 id="reports-teaser">
        <i className="fa-solid fa-people-group" aria-hidden="true"></i> {t('reports.teaserTitle')}
      </h2>
      <p>{active.length ? t('reports.teaserCount', { count: active.length, water }) : t('reports.teaserNone')}</p>
      <p className="ms-actions">
        <Link href="/reports" className="ms-btn ms-btn--secondary">{t('reports.seeReports')}</Link>
        <Link href="/report" className="ms-btn ms-btn--secondary">{t('reports.reportWater')}</Link>
      </p>
    </section>
  );
}
