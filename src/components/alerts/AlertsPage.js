"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import WarningCard from './WarningCard';
import Tabs from '../shared/Tabs';
import LevelBadge, { LevelShape } from '../shared/LevelBadge';
import ExternalLink from '../shared/ExternalLink';
import { useWeather, usePersonas } from '../../lib/context/WeatherProvider';
import { usePlaceSnapshots } from '../../lib/hooks/usePlaceSnapshots';
import { useNow } from '../../lib/hooks/useNow';
import { localParts } from '../../lib/mausam/time';
import { warningsByDay, alertSections } from '../../lib/mausam/warnings';
import { levelName } from '../../lib/mausam/hazards';
import { fmtWeekday, relativeDay, fmtTime } from '../../lib/format';
import { EMERGENCY_NUMBERS } from '../../data/emergencyNumbers';

function Section({ id, title, children, empty }) {
  return (
    <section className="ms-card" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children || <p className="ms-muted">{empty}</p>}
    </section>
  );
}

/**
 * Alerts (PRD 7.2, 18.5): official warnings for your places. Never shows
 * "No warnings" when official sources could not be checked.
 */
export default function AlertsPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const weather = useWeather();
  const { ids: personaIds } = usePersonas();
  const now = useNow();
  const [tab, setTab] = useState('current');
  const others = weather.places.filter((p) => p.id !== weather.place.id).slice(0, 5);
  const otherSnaps = usePlaceSnapshots(others, { include: 'warnings,marine', lang: lang === 'hi' ? 'hi' : 'en' });
  const snapshot = tab === 'current' ? weather.snapshot : otherSnaps[tab];
  const offsetMin = (snapshot?.utcOffsetSeconds ?? 19800) / 60;
  const today = now ? localParts(now, offsetMin).date : null;
  const status = snapshot?.warningsStatus;
  const warnings = (snapshot?.warnings || []).filter((w) => !w.validTo || !now || Date.parse(w.validTo) > now);
  const s = alertSections(warnings);
  const days = today ? warningsByDay(warnings, today, 5) : [];
  const [openDay, setOpenDay] = useState(null);
  const showMarine = personaIds.includes('coast') || personaIds.includes('fisher') || snapshot?.place?.isCoastal;
  const tabName = (p) => (lang === 'hi' && p.nameHi ? p.nameHi : p.name);

  return (
    <>
      <PageHeader title={t('pages.alerts.title')} subtitle={t('pages.alerts.subtitle')} />

      <Tabs
        label={t('alerts.places')}
        active={tab}
        onChange={setTab}
        tabs={[{ id: 'current', place: weather.place }, ...others.map((p) => ({ id: p.id, place: p }))].map(({ id, place }) => ({ id, label: tabName(place) }))}
      >
        {() => (
          <>
            {!snapshot ? (
              <div className="ms-skeleton"></div>
            ) : status === 'unavailable' ? (
              <section className="ms-card ms-unknown" role="status">
                <h2>{t('levels.cannotCheck')}</h2>
                <p>{t('alerts.unavailableBody', { time: fmtTime(snapshot.current?.updatedAt, lang) })}</p>
                <p>
                  <ExternalLink href="https://mausam.imd.gov.in">{t('alerts.visitImd')}</ExternalLink> ·{' '}
                  <ExternalLink href="https://sachet.ndma.gov.in">{t('alerts.visitSachet')}</ExternalLink>
                </p>
                <p className="ms-muted">{t('alerts.imdNotConnected')}</p>
              </section>
            ) : status === 'not_applicable' ? (
              <section className="ms-card" role="status">
                <p>{t('levels.notApplicable')}</p>
              </section>
            ) : (
              <>
                {status === 'partial' ? <p className="ms-muted" role="status">{t('alerts.partial')}</p> : null}
                {!warnings.length ? (
                  <section className="ms-card">
                    <p className="ms-status ms-status--none">
                      <i className="fa-solid fa-circle-check" aria-hidden="true"></i> {t('levels.noWarnings')}
                    </p>
                    <p className="ms-muted">{t('alerts.checkedSources')}</p>
                  </section>
                ) : null}

                <Section id="al-now" title={t('alerts.now')} empty={t('alerts.noNowcast')}>
                  {s.nowcast.length ? s.nowcast.map((w) => <WarningCard key={w.id} w={w} today={today} now={now} />) : null}
                </Section>

                <section className="ms-card" aria-labelledby="al-days">
                  <h2 id="al-days">{t('alerts.next5')}</h2>
                  <ol className="ms-days5">
                    {days.map((d) => {
                      const lvl = levelName(d.level);
                      const rel = relativeDay(d.date, today);
                      const expanded = openDay === d.date;
                      return (
                        <li key={d.date}>
                          <button type="button" className={`ms-day5 ms-day5--${lvl}`} aria-expanded={expanded} onClick={() => setOpenDay(expanded ? null : d.date)}>
                            <span className="ms-day5-name">{rel ? t(`common.${rel}`) : fmtWeekday(d.date, lang)}</span>
                            <LevelShape level={lvl} size={18} />
                            <span className="ms-day5-level">{t(`levels.${lvl}`)}</span>
                            <span className="visually-hidden">
                              {d.hazards.length ? d.hazards.map((h) => t(`hazards.${h}`)).join(', ') : t('levels.action.green')}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                  {openDay ? (
                    <div className="ms-card-stack">
                      {(days.find((d) => d.date === openDay)?.warnings || []).map((w) => (
                        <WarningCard key={w.id} w={w} today={today} now={now} />
                      ))}
                      {!days.find((d) => d.date === openDay)?.warnings.length ? <p className="ms-muted">{t('alerts.noneThatDay')}</p> : null}
                    </div>
                  ) : null}
                </section>

                <Section id="al-disaster" title={t('alerts.disaster')} empty={t('alerts.noDisaster')}>
                  {s.disaster.length ? <div className="ms-card-stack">{s.disaster.map((w) => <WarningCard key={w.id} w={w} today={today} now={now} />)}</div> : null}
                </Section>

                {showMarine ? (
                  <Section id="al-marine" title={t('alerts.marine')} empty={t('alerts.noMarine')}>
                    {s.marine.length ? <div className="ms-card-stack">{s.marine.map((w) => <WarningCard key={w.id} w={w} today={today} now={now} />)}</div> : null}
                    <p>
                      <ExternalLink href="https://incois.gov.in/site/services/hwa.jsp">{t('widgets.seaState.incois')}</ExternalLink>
                    </p>
                  </Section>
                ) : null}

                {s.cyclone.length || snapshot.cyclone ? (
                  <Section id="al-cyclone" title={t('alerts.cyclone')}>
                    {snapshot.cyclone ? (
                      <p>
                        {t('alerts.cycloneStatus', {
                          name: snapshot.cyclone.name,
                          km: snapshot.cyclone.distanceKm,
                          heading: snapshot.cyclone.heading,
                          speed: snapshot.cyclone.speedKmh,
                          hours: snapshot.cyclone.landfallInHours,
                        })}
                      </p>
                    ) : null}
                    <div className="ms-card-stack">
                      {s.cyclone.map((w) => <WarningCard key={w.id} w={w} today={today} now={now} />)}
                    </div>
                  </Section>
                ) : null}

                {snapshot.regionalWarnings?.length ? (
                  <Section id="al-region" title={t('alerts.regional', { state: snapshot.place?.state || '' })}>
                    <div className="ms-card-stack">
                      {snapshot.regionalWarnings.slice(0, 10).map((w) => <WarningCard key={w.id} w={w} today={today} now={now} />)}
                    </div>
                    {snapshot.regionalWarnings.length > 10 ? <p className="ms-muted">{t('alerts.regionalMore', { count: snapshot.regionalWarnings.length - 10 })}</p> : null}
                  </Section>
                ) : null}
              </>
            )}
          </>
        )}
      </Tabs>

      <section className="ms-card" id="colours" aria-labelledby="al-legend">
        <h2 id="al-legend">{t('alerts.legend')}</h2>
        <ul className="ms-legend">
          {['green', 'yellow', 'orange', 'red'].map((l) => (
            <li key={l}>
              <LevelBadge level={l} /> {t(`levels.action.${l}`)}: {t(`alerts.legendText.${l}`)}
            </li>
          ))}
        </ul>
        <Link href="/learn/colours">{t('alerts.learnColours')}</Link>
      </section>

      <section className="ms-card" aria-labelledby="al-emergency">
        <h2 id="al-emergency">{t('alerts.emergency')}</h2>
        <ul className="ms-emergency">
          {EMERGENCY_NUMBERS.filter((n) => ['112', '108', '1070', '1077', '1078'].includes(n.number)).map((n) => (
            <li key={n.number}>
              <a href={`tel:${n.number}`} className={`ms-btn ${n.primary ? '' : 'ms-btn--secondary'}`}>
                <i className="fa-solid fa-phone" aria-hidden="true"></i> {n.number} · {t(`emergency.${n.key}`)}
              </a>
            </li>
          ))}
        </ul>
        <p className="ms-muted">{t('alerts.verifyNumbers')}</p>
      </section>
    </>
  );
}
