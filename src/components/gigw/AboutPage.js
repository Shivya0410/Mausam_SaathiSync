"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import ContentPage from './ContentPage';
import ExternalLink from '../shared/ExternalLink';
import { MODEL_CARDS } from '../../data/modelCards';
import { SITE } from '../../config/site';

const SOURCES = [
  ['imd', 'https://mausam.imd.gov.in'],
  ['sachet', 'https://sachet.ndma.gov.in'],
  ['cpcb', 'https://airquality.cpcb.gov.in'],
  ['openMeteo', 'https://open-meteo.com'],
  ['osm', 'https://www.openstreetmap.org/copyright'],
  ['aviation', 'https://aviationweather.gov'],
  ['suncalc', 'https://github.com/mourner/suncalc'],
  ['ccsn', 'https://github.com/upuil/CCSN-Database'],
];

function Status() {
  const { t } = useTranslation();
  const [h, setH] = useState(null);
  useEffect(() => {
    let live = true;
    fetch('/api/mausam/health')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => live && setH(j || 'error'))
      .catch(() => live && setH('error'));
    return () => {
      live = false;
    };
  }, []);
  if (!h) return <div className="ms-skeleton"></div>;
  if (h === 'error') return <p role="status">{t('gigw.about.statusError')}</p>;
  return (
    <ul className="ms-list">
      {Object.entries(h.configured || {}).map(([k, v]) => (
        <li key={k}>
          {t(`gigw.about.providers.${k}`, { defaultValue: k })}: <strong>{v ? t('gigw.about.on') : t('gigw.about.off')}</strong>
        </li>
      ))}
      <li>
        {t('gigw.about.storage')}: <strong>{h.persistence?.durable ? t('gigw.about.durable') : t('gigw.about.notDurable')}</strong>
      </li>
    </ul>
  );
}

/** About (PRD 15.3, 11.6): what it is, sources, model cards, team, status. */
export default function AboutPage() {
  const { t } = useTranslation();
  return (
    <ContentPage
      page="about"
      ids={['what', 'problem', 'how']}
      after={
        <>
          <section className="ms-card" aria-labelledby="about-sources" id="sources">
            <h2 id="about-sources">{t('gigw.about.sources.title')}</h2>
            <ul className="ms-list">
              {SOURCES.map(([k, href]) => (
                <li key={k}>
                  <ExternalLink href={href}>{t(`gigw.about.sources.${k}.name`)}</ExternalLink>: {t(`gigw.about.sources.${k}.use`)}
                </li>
              ))}
            </ul>
          </section>
          <section className="ms-card" aria-labelledby="about-models" id="models">
            <h2 id="about-models">{t('gigw.about.models.title')}</h2>
            <p>{t('gigw.about.models.intro')}</p>
            {MODEL_CARDS.map((m) => (
              <article key={m.id} className="ms-model-card" aria-labelledby={`mc-${m.id}`}>
                <h3 id={`mc-${m.id}`}>{t(`gigw.about.models.${m.id}.name`)}</h3>
                <dl className="ms-kv">
                  <div><dt>{t('gigw.about.models.purpose')}</dt><dd>{t(`gigw.about.models.${m.id}.purpose`)}</dd></div>
                  <div><dt>{t('gigw.about.models.method')}</dt><dd>{m.architecture}, {m.inputSize}</dd></div>
                  <div><dt>{t('gigw.about.models.data')}</dt><dd>{t(`gigw.about.models.${m.id}.data`)}</dd></div>
                  <div>
                    <dt>{t('gigw.about.models.accuracy')}</dt>
                    <dd>{m.accuracy ? t('gigw.about.models.measured', { pct: Math.round(m.accuracy.top1 * 100), n: m.accuracy.testImages }) : t('gigw.about.models.notMeasured')}</dd>
                  </div>
                  <div><dt>{t('gigw.about.models.status')}</dt><dd>{m.kind === 'classical' ? t('gigw.about.models.builtIn') : t('gigw.about.models.notInstalled')}</dd></div>
                  <div><dt>{t('gigw.about.models.leaves')}</dt><dd>{t('gigw.about.models.nothingLeaves')}</dd></div>
                  <div><dt>{t('gigw.about.models.limits')}</dt><dd>{t(`gigw.about.models.${m.id}.limits`)}</dd></div>
                </dl>
              </article>
            ))}
          </section>
          <section className="ms-card" aria-labelledby="about-status" id="status">
            <h2 id="about-status">{t('gigw.about.statusTitle')}</h2>
            <Status />
          </section>
          <section className="ms-card ms-article" aria-labelledby="about-team" id="team">
            <h2 id="about-team">{t('gigw.about.team.title')}</h2>
            <p>{t('footer.ownership')}</p>
            <p className="ms-callout">{t('gigw.about.disclaimer')}</p>
            <p>{t('gigw.about.production')}</p>
            <p>{t('settings.about.version', { version: SITE.version })} · <Link href="/policies/disclaimer">{t('policies.disclaimer.title')}</Link></p>
          </section>
        </>
      }
    />
  );
}
