"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import Tabs from '../shared/Tabs';
import SampleDataBadge from '../shared/SampleDataBadge';
import ReportCard from './ReportCard';
import { useWeather } from '../../lib/context/WeatherProvider';
import { useStore } from '../../lib/hooks/useStore';
import { useNow } from '../../lib/hooks/useNow';
import { stores } from '../../lib/stores';
import { sortNearMe, isActive } from '../../lib/mausam/reports';

const TYPES = ['all', 'waterlogging', 'sky', 'fog'];

/** Community reports (PRD 9.7): Near me, Map, My reports, How it works. */
export default function ReportsPage() {
  const { t } = useTranslation();
  const weather = useWeather();
  const now = useNow();
  const [myReports] = useStore(stores.myReports);
  const [tab, setTab] = useState('near');
  const [type, setType] = useState('all');
  const [patches, setPatches] = useState({});
  const { reports, status, durable, refresh } = weather.reports;

  const list = useMemo(() => {
    if (!now) return [];
    const merged = reports.map((r) => (patches[r.id] ? { ...r, ...patches[r.id] } : r));
    return sortNearMe(merged, now).filter((r) => type === 'all' || r.type === type);
  }, [reports, patches, now, type]);
  const onChange = (r) => setPatches((p) => ({ ...p, [r.id]: r }));
  const place = weather.place;

  return (
    <>
      <PageHeader title={t('pages.reports.title')} subtitle={t('pages.reports.subtitle')} />
      <p className="ms-actions">
        <Link href="/report" className="ms-btn">
          <i className="fa-solid fa-camera" aria-hidden="true"></i> {t('reports.reportWater')}
        </Link>
        <Link href="/sky-snap" className="ms-btn ms-btn--secondary">
          <i className="fa-solid fa-cloud" aria-hidden="true"></i> {t('reports.snapSky')}
        </Link>
      </p>
      <Tabs
        label={t('pages.reports.title')}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'near', label: t('reports.tabs.near') },
          { id: 'map', label: t('reports.tabs.map') },
          { id: 'mine', label: t('reports.tabs.mine') },
          { id: 'how', label: t('reports.tabs.how') },
        ]}
      >
        {(active) =>
          active === 'near' ? (
            <section aria-labelledby="rp-near">
              <h2 id="rp-near" className="visually-hidden">{t('reports.tabs.near')}</h2>
              <p className="ms-muted">
                {t('reports.nearIntro', { place: place.name, km: 10 })}
                {weather.demo ? <> <SampleDataBadge variant="demo" /></> : null}
              </p>
              <div className="ms-chipgroup" role="group" aria-label={t('reports.filter')}>
                {TYPES.map((x) => (
                  <button key={x} type="button" className="ms-chip-btn" aria-pressed={type === x} onClick={() => setType(x)}>
                    {t(`reports.types.${x}`)}
                  </button>
                ))}
              </div>
              {status === 'loading' || status === 'idle' ? (
                <div className="ms-skeleton"></div>
              ) : status === 'error' ? (
                <p className="ms-card" role="alert">
                  {t('reports.loadFailed')}{' '}
                  <button type="button" className="ms-chip-btn" onClick={refresh}>{t('common.retry')}</button>
                </p>
              ) : list.length ? (
                <div className="ms-card-stack">
                  {list.map((r) => <ReportCard key={r.id} report={r} places={weather.places} now={now} onChange={onChange} />)}
                </div>
              ) : (
                <p className="ms-card">{t('reports.none')}</p>
              )}
              {durable === false ? <p className="ms-muted">{t('reports.notDurable')}</p> : null}
            </section>
          ) : active === 'map' ? (
            <section className="ms-card">
              <p>{t('reports.mapIntro')}</p>
              <Link href="/map?layer=reports" className="ms-btn ms-btn--secondary">{t('reports.openMap')}</Link>
            </section>
          ) : active === 'mine' ? (
            <section aria-labelledby="rp-mine">
              <h2 id="rp-mine" className="visually-hidden">{t('reports.tabs.mine')}</h2>
              <p className="ms-muted">{t('reports.mineIntro')}</p>
              {myReports.length ? (
                <div className="ms-card-stack">
                  {myReports.map((r) => (
                    <ReportCard key={r.id} report={now && !isActive(r, now) ? { ...r, status: 'expired' } : r} places={weather.places} now={now} mine />
                  ))}
                </div>
              ) : (
                <p className="ms-card">{t('reports.mineNone')}</p>
              )}
            </section>
          ) : (
            <section className="ms-card" aria-labelledby="rp-how">
              <h2 id="rp-how">{t('reports.how.title')}</h2>
              <ul className="ms-list">
                {t('reports.how.points', { returnObjects: true }).map((x) => <li key={x}>{x}</li>)}
              </ul>
              <p className="ms-muted">{t('reports.how.notOfficial')}</p>
            </section>
          )
        }
      </Tabs>
    </>
  );
}
