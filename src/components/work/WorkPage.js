"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PersonaPage from '../persona/PersonaPage';
import { FirstAid } from '../persona/Sections';
import LightningTakeover from './LightningTakeover';
import ExternalLink from '../shared/ExternalLink';
import { useStore } from '../../lib/hooks/useStore';
import { stores } from '../../lib/stores';
import { heatDangerSpan } from '../../lib/mausam/rules/events';
import { fmtDistance, fmtTime } from '../../lib/format';

/**
 * Water reminders every 30 minutes during danger hours, while the app is
 * open or installed (PRD 8.9). Needs notification permission; without it
 * the reminder shows on the page instead.
 */
function useWaterReminder(enabled, span, message) {
  const [last, setLast] = useState(null);
  useEffect(() => {
    if (!enabled || !span) return undefined;
    const tick = () => {
      const now = Date.now();
      if (now < Date.parse(span.start) || now > Date.parse(span.end)) return;
      setLast(now);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(message, { tag: 'water' });
        } catch {
          // Service-worker-only browsers: the on-page reminder still shows.
        }
      }
    };
    const id = setInterval(tick, 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [enabled, span, message]);
  return last;
}

/** Outdoor work (PRD 8.9): heat danger, lightning, cool spots, first aid. */
export default function WorkPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [settings, setSettings] = useStore(stores.personaSettings);
  const [safeAt, setSafeAt] = useState(0);
  const remind = Boolean(settings.work.waterReminders);
  return (
    <PersonaPage persona="work" pageKey="work" hero="heatDanger" widgets={['lightning', 'rainSoon', 'aqi', 'humidityHeat']} services={['ndma', 'damini']} learn={['heat', 'lightning', 'aqi']}>
      {({ view, env }) => (
        <WorkSections
          view={view}
          env={env}
          remind={remind}
          setRemind={(v) => setSettings((s) => ({ ...s, work: { ...s.work, waterReminders: v } }))}
          safeAt={safeAt}
          setSafeAt={setSafeAt}
          t={t}
          lang={lang}
        />
      )}
    </PersonaPage>
  );
}

function WorkSections({ view, env, remind, setRemind, safeAt, setSafeAt, t, lang }) {
  const span = view ? heatDangerSpan(view.ctx) : null;
  const last = useWaterReminder(remind, span, t('work.waterNow'));
  if (!view) return null;
  const strike = view.cards.find((c) => c.ruleId === 'work.lightning30');
  const since = strike?.params.lastStrike ? Date.parse(strike.params.lastStrike) : view.ctx.nowMs;
  const showTakeover = strike && safeAt < since + 1;
  const spots = env.coolSpots.filter((s) => s.distanceM <= 10000).slice(0, 8);
  return (
    <>
      {showTakeover ? <LightningTakeover since={since} onSafe={() => setSafeAt(Date.now())} /> : null}
      <section className="ms-card" aria-labelledby="w-water">
        <h2 id="w-water">{t('work.waterTitle')}</h2>
        <div className="ms-switch-row">
          <button type="button" role="switch" aria-checked={remind} className="ms-switch" onClick={() => setRemind(!remind)}>
            <span className="ms-switch-track" aria-hidden="true"><span className="ms-switch-thumb"></span></span>
            <span>{t('work.waterToggle')}</span>
          </button>
          <p className="ms-muted">{t('work.waterPermission')}</p>
        </div>
        {span ? <p>{t('work.dangerWindow', { start: fmtTime(span.start, lang), end: fmtTime(span.end, lang) })}</p> : <p className="ms-muted">{t('work.noDanger')}</p>}
        {last ? <p role="status">{t('work.waterNow')}</p> : null}
      </section>
      <section className="ms-card" aria-labelledby="w-cool">
        <h2 id="w-cool">{t('work.coolTitle')}</h2>
        {spots.length ? (
          <ul className="ms-list">
            {spots.map((s) => (
              <li key={s.name}>
                <strong>{s.name}</strong> · {fmtDistance(s.distanceM, lang)} · {t(`coolSpotTypes.${s.type}`)}
                <br />
                <span className="ms-muted">{t('widgets.coolSpots.publicPlace')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ms-muted">{t('widgets.coolSpots.none')}</p>
        )}
      </section>
      <FirstAid titleKey="firstAid.heatStroke.title" signsKey="firstAid.heatStroke.signs" stepsKey="firstAid.heatStroke.steps" open />
      <FirstAid titleKey="firstAid.lightning.title" stepsKey="firstAid.lightning.steps" />
      <section className="ms-card" aria-labelledby="w-mask">
        <h2 id="w-mask">{t('work.airTitle')}</h2>
        <p>{env.snapshot?.air ? t(`work.airAdvice.${env.snapshot.air.aqi >= 201 ? 'high' : env.snapshot.air.aqi >= 101 ? 'mid' : 'low'}`) : t('common.notAvailableHere')}</p>
      </section>
      <section className="ms-card" aria-labelledby="w-rights">
        <h2 id="w-rights">{t('work.rightsTitle')}</h2>
        <p>{t('work.rightsNote')}</p>
        <ExternalLink href="https://ndma.gov.in/Natural-Hazards/Heat-Wave">{t('work.rightsLink')}</ExternalLink>
      </section>
    </>
  );
}
