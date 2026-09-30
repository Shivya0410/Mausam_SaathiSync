"use client";

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SampleDataBadge from '../shared/SampleDataBadge';
import { useStore } from '../../lib/hooks/useStore';
import { stores } from '../../lib/stores';
import { voteOnReport } from '../../lib/reportsClient';
import { minutesAgo } from '../../lib/mausam/reports';
import { haversineKm } from '../../lib/mausam/geo';

const ICON = { waterlogging: 'fa-solid fa-water', sky: 'fa-solid fa-cloud', fog: 'fa-solid fa-smog' };

/** Area label: the demo area name, else the nearest saved place, else distance. Never an address. */
export function reportArea(r, places, t) {
  if (r.areaName) return r.areaName;
  const near = places
    .map((p) => ({ p, d: haversineKm(p, r) }))
    .filter((x) => x.d <= 2)
    .sort((a, b) => a.d - b.d)[0];
  if (near) return t('reports.nearPlace', { place: near.p.name });
  return Number.isFinite(r.distanceKm) ? t('reports.kmAway', { km: r.distanceKm }) : t('reports.nearby');
}

/** What the report says, in words: severity for water, cloud or fog label otherwise. */
export function reportWhat(r, t) {
  if (r.type === 'waterlogging') return `${t('reports.types.waterlogging')} · ${t(`severity.${r.severity || 1}`)}`;
  if (r.type === 'sky') return `${t('reports.types.sky')} · ${t(`cloudTypes.${r.label}.name`, { defaultValue: r.label })}`;
  return `${t('reports.types.fog')} · ${t(`reports.fogLabels.${r.label}`, { defaultValue: r.label })}`;
}

/**
 * One crowd report (PRD 9.7): type, what, area, time ago, AI check,
 * confirmations and a "Still there?" vote.
 */
export default function ReportCard({ report, places = [], now, onChange, mine = false }) {
  const { t } = useTranslation();
  const [votes] = useStore(stores.reportVotes);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const voted = votes[report.id];
  const vote = async (v) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await voteOnReport(report, v);
      onChange?.(updated);
    } catch (e) {
      setError(e.code === 'conflict' ? t('reports.alreadyVoted') : e.code === 'not_found' ? t('reports.gone') : t('reports.voteFailed'));
    } finally {
      setBusy(false);
    }
  };
  const mins = now ? minutesAgo(report, now) : null;
  const pct = Math.round((report.confidence || 0) * 100);

  return (
    <article className={`ms-card ms-report ms-report--${report.status}`} aria-label={reportWhat(report, t)}>
      <div className="ms-report-head">
        <i className={`${ICON[report.type]} ms-report-icon`} aria-hidden="true"></i>
        <div>
          <h3 className="ms-report-title">{reportWhat(report, t)}</h3>
          <p className="ms-muted">
            {reportArea(report, places, t)}
            {mins != null ? ` · ${t('reports.minutesAgo', { minutes: mins })}` : ''}
          </p>
        </div>
        {report.demo ? <SampleDataBadge variant="demo" /> : null}
      </div>
      <p className="ms-report-meta">
        <span className={`ms-kind ms-kind--${report.status === 'unverified' ? 'tip' : 'good'}`}>{t(`reportStatus.${report.status}`)}</span>{' '}
        {report.type === 'waterlogging' ? t('reports.aiCheck', { pct }) : t('reports.aiCheckOther', { pct })}
        {' · '}
        {t('reports.confirmed', { count: report.confirmations || 0 })}
      </p>
      {!mine ? (
        <div className="ms-report-vote" role="group" aria-label={t('reports.stillThere')}>
          <span>{t('reports.stillThere')}</span>
          <button type="button" className="ms-chip-btn" aria-pressed={voted === 'still'} disabled={busy || Boolean(voted)} onClick={() => vote('still')}>
            {t('common.yes')}
          </button>
          <button type="button" className="ms-chip-btn" aria-pressed={voted === 'cleared'} disabled={busy || Boolean(voted)} onClick={() => vote('cleared')}>
            {t('common.no')}
          </button>
          {voted ? <span className="ms-muted" role="status">{t('reports.thanksVote')}</span> : null}
        </div>
      ) : null}
      {error ? <p className="ms-error" role="alert">{error}</p> : null}
    </article>
  );
}
