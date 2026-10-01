"use client";

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PersonaPage from '../persona/PersonaPage';
import { FirstAid } from '../persona/Sections';
import BreathWidget from './BreathWidget';
import LevelBadge from '../shared/LevelBadge';
import ExternalLink from '../shared/ExternalLink';
import { useStore } from '../../lib/hooks/useStore';
import { stores } from '../../lib/stores';
import { useWeather } from '../../lib/context/WeatherProvider';
import { SENSITIVITIES } from '../../config/personas';
import { levelName } from '../../lib/mausam/hazards';

/** Hospital search links for the current place (E-open: no hospitals map yet). */
export function hospitalLinks(place) {
  if (!Number.isFinite(place?.lat) || !Number.isFinite(place?.lon)) return null;
  const q = `${place.lat.toFixed(3)},${place.lon.toFixed(3)}`;
  return {
    google: `https://www.google.com/maps/search/hospital+near+${q}`,
    osm: `https://www.openstreetmap.org/search?query=hospital%20near%20${q}#map=13/${place.lat.toFixed(3)}/${place.lon.toFixed(3)}`,
  };
}

const HEAT = ['heat_wave', 'severe_heat_wave', 'hot_humid', 'warm_night'];
const COLD = ['cold_wave', 'cold_day', 'ground_frost'];

/** Health (PRD 8.1): air, UV, humidity and heat, with advice for sensitivities. */
export default function HealthPage() {
  const { t } = useTranslation();
  const [sens] = useStore(stores.sensitivities);
  const weather = useWeather();
  const links = hospitalLinks(weather.place);
  const [forMe, setForMe] = useState(true);
  return (
    <PersonaPage
      persona="health"
      pageKey="health"
      hero="aqi"
      widgets={['bestTimeOut', 'uv', 'humidityHeat', 'allergyEstimate']}
      services={['cpcb']}
      learn={['aqi', 'uv', 'heat']}
      disclaimerKey="health.disclaimer"
    >
      {({ view, env }) => {
        const air = env.snapshot?.air;
        const heat = view?.ctx.officialWarnings.find((w) => HEAT.includes(w.hazard));
        const cold = view?.ctx.officialWarnings.find((w) => COLD.includes(w.hazard));
        const mine = sens.list.length ? sens.list : [];
        return (
          <>
            {air ? (
              <section className="ms-card" aria-labelledby="h-sens">
                <h2 id="h-sens">{t('health.adviceTitle', { category: t(`aqi.category.${air.category}`) })}</h2>
                {mine.length ? (
                  <button type="button" className="ms-chip-btn" aria-pressed={forMe} onClick={() => setForMe((v) => !v)}>
                    {t('health.forMySensitivities')}
                  </button>
                ) : (
                  <p className="ms-muted">{t('health.addSensitivities')}</p>
                )}
                <ul className="ms-list">
                  {(forMe && mine.length ? mine : SENSITIVITIES).map((s) => (
                    <li key={s}>
                      <strong>{t(`sensitivities.${s}`)}:</strong> {t(`health.sensAdvice.${air.aqi >= 201 ? 'high' : air.aqi >= 101 ? 'mid' : 'low'}.${s}`)}
                    </li>
                  ))}
                </ul>
                <p className="ms-muted">{t(`aqi.health.${air.category}`)}</p>
              </section>
            ) : null}
            <section className="ms-card" aria-labelledby="h-heatcold">
              <h2 id="h-heatcold">{t('health.heatCold')}</h2>
              <p>
                {heat ? <><LevelBadge level={levelName(heat.level)} withAction /> {t(`hazards.${heat.hazard}`)}</> : t('health.noHeatWarning')}
              </p>
              <p>
                {cold ? <><LevelBadge level={levelName(cold.level)} withAction /> {t(`hazards.${cold.hazard}`)}</> : t('health.noColdWarning')}
              </p>
            </section>
            <FirstAid titleKey="firstAid.heatStroke.title" signsKey="firstAid.heatStroke.signs" stepsKey="firstAid.heatStroke.steps" />
            <FirstAid titleKey="firstAid.hypothermia.title" signsKey="firstAid.hypothermia.signs" stepsKey="firstAid.hypothermia.steps" />
            <section className="ms-card" aria-labelledby="h-breath">
              <h2 id="h-breath">{t('health.breath.section')}</h2>
              <BreathWidget />
            </section>
            <section className="ms-card" aria-labelledby="h-help">
              <h2 id="h-help">{t('health.hospitals')}</h2>
              <p>{t('health.hospitalsNote')}</p>
              <p className="ms-actions">
                <a href="tel:108" className="ms-btn ms-btn--danger">
                  <i className="fa-solid fa-phone" aria-hidden="true"></i> {t('firstAid.call', { number: '108' })}
                </a>
                {links ? (
                  <ExternalLink href={links.google} className="ms-btn ms-btn--secondary">
                    <i className="fa-solid fa-hospital" aria-hidden="true"></i> {t('health.findHospitals')}
                  </ExternalLink>
                ) : null}
              </p>
              {links ? <p className="ms-muted">{t('health.mapNote')}</p> : null}
            </section>
          </>
        );
      }}
    </PersonaPage>
  );
}
