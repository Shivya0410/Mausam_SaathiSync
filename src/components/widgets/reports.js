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
