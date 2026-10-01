"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { isActive } from '../../lib/mausam/reports';

/**
 * Home teaser (PRD 5.2 item 12): shown in the monsoon or when reports exist
 * nearby. One line and a link, so it costs little space.
 */
export default function ReportsTeaser({ reports, season, now }) {
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
