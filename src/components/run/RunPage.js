"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PersonaPage from '../persona/PersonaPage';
import { ChipGroup } from '../persona/Sections';
import { RunWindowWidget } from '../widgets/active';
import { useStore } from '../../lib/hooks/useStore';
import { stores } from '../../lib/stores';
import { runWindow } from '../../lib/mausam/rules/fitness';
import { fmtTemp, fmtTime } from '../../lib/format';
import { heatBand } from '../../lib/mausam/indices/heatIndex';

const ACTIVITIES = ['walk', 'run', 'cycle', 'sports', 'yoga', 'trek'];

/** Run and play (PRD 8.2): best window, activity and duration, sun, wind, heat. */
export default function RunPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [settings, setSettings] = useStore(stores.personaSettings);
  const fit = settings.fitness;
  const setFit = (patch) => setSettings((s) => ({ ...s, fitness: { ...s.fitness, ...patch } }));
  return (
    <PersonaPage persona="fitness" pageKey="run" widgets={['sunTimes', 'wind', 'humidityHeat', 'aqi', 'uv']} services={['fitIndia']} learn={['heat', 'lightning', 'aqi']}>
      {({ view }) => {
        const w = view ? runWindow(view.ctx) : null;
        const nowH = view?.ctx.hourAt(view.ctx.nowMs);
        const best = w && !w.none ? w.hours.reduce((a, b) => (b.score > a.score ? b : a)) : null;
        return (
          <>
            <section className="ms-card" aria-labelledby="r-settings">
              <h2 id="r-settings">{t('run.yourActivity')}</h2>
              <ChipGroup label={t('run.activity')} options={ACTIVITIES.map((a) => ({ value: a, label: t(`activityNames.${a}`) }))} value={fit.activity} onChange={(v) => setFit({ activity: v })} />
              <ChipGroup
                label={t('run.duration')}
                options={[30, 60, 90].map((m) => ({ value: m, label: t('onboarding.details.minutes', { m }) }))}
                value={fit.durationMin}
                onChange={(v) => setFit({ durationMin: v })}
              />
              <ChipGroup
                label={t('onboarding.details.usualTime')}
                options={['early_morning', 'morning', 'evening', 'night'].map((b) => ({ value: b, label: t(`bandsTime.${b}`) }))}
                value={fit.band}
                onChange={(v) => setFit({ band: v })}
              />
            </section>
            {view ? (
              <div className="ms-hero">
                <RunWindowWidget view={view} hero />
              </div>
            ) : null}
            {best && nowH ? (
              <section className="ms-card" aria-labelledby="r-compare">
                <h2 id="r-compare">{t('run.compare')}</h2>
                <div className="ms-compare">
                  <div>
                    <h3>{t('run.now')}</h3>
                    <p>{t('run.heatAir', { feels: fmtTemp(nowH.feelsC), aqi: view.ctx.aqiOf(nowH) ?? '–' })}</p>
                  </div>
                  <div>
                    <h3>{t('run.atBest', { time: fmtTime(best.time, lang) })}</h3>
                    <p>{t('run.heatAir', { feels: fmtTemp(best.feelsC), aqi: best.aqi ?? '–' })}</p>
                  </div>
                </div>
              </section>
            ) : null}
            <section className="ms-card" aria-labelledby="r-water">
              <h2 id="r-water">{t('run.hydration')}</h2>
              <p>{t(`run.water.${heatBand(best?.feelsC ?? nowH?.feelsC ?? 25) || 'comfortable'}`)}</p>
              <p className="ms-muted">{t('run.hydrationNote')}</p>
            </section>
            <p>
              <Link href="/events">{t('run.plannedEvent')}</Link>
            </p>
          </>
        );
      }}
    </PersonaPage>
  );
}

