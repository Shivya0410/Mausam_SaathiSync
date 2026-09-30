"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PersonaPage from '../persona/PersonaPage';
import { Tips } from '../persona/Sections';
import WeatherIcon from '../shared/WeatherIcon';
import ExternalLink from '../shared/ExternalLink';
import { useWeather } from '../../lib/context/WeatherProvider';
import { usePlaceSnapshots } from '../../lib/hooks/usePlaceSnapshots';
import { useStore } from '../../lib/hooks/useStore';
import { stores } from '../../lib/stores';
import { midpoint } from '../../lib/mausam/geo';
import { nextClockTime, isoAt, sliceHours } from '../../lib/mausam/time';
import { rainSpans, leaveVerdict, trafficLink } from '../../lib/mausam/commute';
import { waterloggingNear } from '../../lib/mausam/rules/commute';
import { fmtTemp, fmtTime, fmtVisibility } from '../../lib/format';

/** Conditions at a place around a departure time. */
function Column({ title, snap, at }) {
  const { t, i18n } = useTranslation();
  const h = snap && at ? sliceHours(snap.hourly, at - 30 * 60000, 1)[0] : null;
  return (
    <div className="ms-col">
      <h3>{title}</h3>
      {h ? (
        <>
          <p><WeatherIcon code={h.wmo} isDay={h.isDay} size={22} /> {t(`wmo.${h.wmo}`)} · {fmtTemp(h.tempC)}</p>
          <p>{t('commute.rain', { prob: h.precipProb })}</p>
          {h.visibilityM != null ? <p>{t('commute.visibility', { vis: fmtVisibility(h.visibilityM, i18n.language) })}</p> : null}
          <p>{t('commute.feels', { hi: fmtTemp(h.feelsC) })}</p>
        </>
      ) : (
        <p className="ms-muted">{t('commute.noPlace')}</p>
      )}
    </div>
  );
}

/** Commute (PRD 8.7): leave now or wait, home/midway/work, fog, waterlogging. */
export default function CommutePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { places, demo } = useWeather();
  const [settings] = useStore(stores.personaSettings);
  const c = settings.commute;
  const home = places.find((p) => p.id === c.homeId) || places.find((p) => p.type === 'home') || null;
  const work = places.find((p) => p.id === c.workId) || places.find((p) => p.type === 'work') || null;
  const mid = home && work ? { id: 'commute-mid', name: 'mid', ...midpoint(home, work) } : null;
  const snaps = usePlaceSnapshots(demo ? [] : [home, work, mid], { include: 'warnings,sun' });
  return (
    <PersonaPage persona="commute" pageKey="commute" hero="commuteNow" widgets={['rainSoon', 'visibility', 'lightning', 'hourly']} services={['imd']} learn={['fog', 'monsoonKit']}>
      {({ view, env }) => {
        if (!view) return null;
        const offset = view.ctx.offsetMin;
        const times = (c.times || []).filter(Boolean);
        const deps = times.map((clock) => nextClockTime(clock, view.ctx.nowMs, offset, 30)).filter(Boolean).sort((a, b) => a - b);
        const next = deps[0];
        const later = deps[1];
        const spans = rainSpans(view.ctx.window(view.ctx.nowMs - 3600e3, 30));
        const eveningV = later ? leaveVerdict({ now: view.ctx.nowMs, departure: later, travelMin: c.travelMin || 45, spans }) : null;
        const snapOf = (p) => (demo ? env.snapshot : p ? snaps[p.id] : null);
        const logged = waterloggingNear(view.ctx);
        return (
          <>
            <section className="ms-card" aria-labelledby="cm-cols">
              <h2 id="cm-cols">{next ? t('commute.atDeparture', { time: fmtTime(isoAt(next, offset), lang) }) : t('commute.setTimesTitle')}</h2>
              <div className="ms-cols">
                <Column title={t('commute.home')} snap={snapOf(home)} at={next} />
                <Column title={t('commute.midway')} snap={snapOf(mid)} at={next} />
                <Column title={t('commute.work')} snap={snapOf(work)} at={next} />
              </div>
              {home && work ? (
                <p className="ms-actions">
                  <ExternalLink href={trafficLink(home, work, c.mode)} className="ms-btn ms-btn--secondary">{t('commute.google')}</ExternalLink>
                  <ExternalLink href={`https://mappls.com/direction?places=${home.lat},${home.lon};${work.lat},${work.lon}`} className="ms-btn ms-btn--secondary">{t('commute.mappls')}</ExternalLink>
                </p>
              ) : (
                <p className="ms-muted">{t('widgets.commuteNow.addPlaces')}</p>
              )}
              <p className="ms-muted">{t('widgets.commuteNow.trafficNote')}</p>
            </section>
            <section className="ms-card" aria-labelledby="cm-water">
              <h2 id="cm-water">{t('commute.waterlogging')}</h2>
              {logged.length ? (
                <ul className="ms-list">
                  {logged.map((r) => (
                    <li key={r.report.id}>
                      <strong>{r.place}</strong> · {t(`severity.${r.report.severity || 1}`)} · {t('commute.minutesAgo', { minutes: r.minutes })} · {t(`reportStatus.${r.report.status}`)} · {t('reports.confirmed', { count: r.report.confirmations || 0 })}
                      {r.report.demo ? ` · ${t('common.demoData')}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ms-muted">{t('commute.noReports')}</p>
              )}
              <p className="ms-actions">
                <Link href="/reports" className="ms-btn ms-btn--secondary">{t('reports.seeReports')}</Link>
                <Link href="/report" className="ms-btn ms-btn--secondary">{t('reports.reportWater')}</Link>
              </p>
            </section>
            {eveningV ? (
              <section className="ms-card" aria-labelledby="cm-evening">
                <h2 id="cm-evening">{t('commute.evening', { time: fmtTime(isoAt(later, offset), lang) })}</h2>
                <p>{t(`verdicts.commute.${eveningV.verdict}`, { time: eveningV.at ? fmtTime(isoAt(eveningV.at, offset), lang) : '' })}</p>
              </section>
            ) : null}
            <section className="ms-card" aria-labelledby="cm-highway">
              <h2 id="cm-highway">{t('travel.roads')}</h2>
              <p>{t('travel.roadsNote')}</p>
            </section>
            <Tips id="cm-tips" titleKey="commute.tipsTitle" listKey="commute.tips" icon="fa-solid fa-motorcycle" />
          </>
        );
      }}
    </PersonaPage>
  );
}
