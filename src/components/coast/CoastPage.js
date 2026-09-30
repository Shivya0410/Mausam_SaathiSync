"use client";

import { useTranslation } from 'react-i18next';
import PersonaPage from '../persona/PersonaPage';
import { Tips } from '../persona/Sections';
import { useStore } from '../../lib/hooks/useStore';
import { useWeather, usePersonas } from '../../lib/context/WeatherProvider';
import { usePlaceSnapshots } from '../../lib/hooks/usePlaceSnapshots';
import { stores } from '../../lib/stores';
import { BEACHES } from '../../data/beaches';
import { sliceHours } from '../../lib/mausam/time';
import { fmtHour, fmtWeekday } from '../../lib/format';
import { seaStateWord } from '../../lib/mausam/indices/seaSafety';

/** Waves, swell and wind by hour as a plain table (big text in fisher mode). */
function SeaTable({ view, env, hours, big }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const sea = sliceHours(env.snapshot?.marine?.hourly, view.ctx.nowMs, hours).filter((_, i) => i % 3 === 0);
  if (!sea.length) return <p className="ms-muted">{t('widgets.seaState.inland')}</p>;
  return (
    <div className="ms-table-wrap" role="region" aria-label={t('coast.waveTable')} tabIndex={0}>
      <table className={`ms-table ${big ? 'ms-table--big' : ''}`}>
        <caption className="visually-hidden">{t('coast.waveTable')}</caption>
        <thead>
          <tr>
            <th scope="col">{t('charts.time')}</th>
            <th scope="col">{t('widgets.seaState.waves')}</th>
            <th scope="col">{t('widgets.seaState.swell')}</th>
            <th scope="col">{t('charts.wind')}</th>
          </tr>
        </thead>
        <tbody>
          {sea.map((h) => {
            const land = view.ctx.hourAt(h.time);
            return (
              <tr key={h.time}>
                <th scope="row">{fmtWeekday(h.time.slice(0, 10), lang)} {fmtHour(h.time, lang)}</th>
                <td>{h.waveM ?? '–'} m · {t(`seaWords.${seaStateWord(h.waveM) || 'calm'}`)}</td>
                <td>{h.swellM ?? '–'} m · {Math.round(h.swellPeriodS ?? 0)} s</td>
                <td>{land ? `${Math.round(land.windKmh)} ${t('units.kmh')}` : '–'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Beach and sea (PRD 8.3), with fisher mode for sea livelihoods. */
export default function CoastPage() {
  const { t } = useTranslation();
  const { ids } = usePersonas();
  const { demo } = useWeather();
  const [settings, setSettings] = useStore(stores.personaSettings);
  const fisher = ids.includes('fisher') && !ids.includes('coast');
  const beach = BEACHES.find((b) => b.id === settings.coast.currentBeachId) || null;
  const beachPlace = beach ? { id: `beach-${beach.id}`, name: beach.name, lat: beach.lat, lon: beach.lon, state: beach.state } : null;
  const snaps = usePlaceSnapshots(beachPlace && !demo ? [beachPlace] : [], { include: 'air,warnings,sun,marine' });
  const beachSnap = beachPlace && !demo ? snaps[beachPlace.id] : null;
  const setBeach = (id) =>
    setSettings((s) => ({ ...s, coast: { ...s.coast, currentBeachId: id || null, beachIds: id ? [...new Set([id, ...(s.coast.beachIds || [])])].slice(0, 6) : s.coast.beachIds } }));

  return (
    <PersonaPage
      persona={fisher ? 'fisher' : 'coast'}
      pageKey="coast"
      snapshot={beachSnap}
      placeLabel={beach && !demo ? beach.name : undefined}
      hero={fisher ? 'fisherWarning' : 'seaState'}
      widgets={fisher ? ['seaState', 'wind', 'sunTimes', 'tides'] : ['tides', 'waterTemp', 'uv', 'wind', 'sunTimes', 'rainSoon']}
      services={['incois', 'imd']}
      learn={['beach', 'cyclone', 'lightning']}
    >
      {({ view, env }) => (
        <>
          <section className="ms-card" aria-labelledby="c-beach">
            <h2 id="c-beach">{t('coast.pickBeach')}</h2>
            {demo ? <p className="ms-muted">{t('places.demoNote')}</p> : null}
            <label className="ms-field">
              <span>{t('onboarding.details.beach')}</span>
              <select value={settings.coast.currentBeachId || ''} onChange={(e) => setBeach(e.target.value)}>
                <option value="">{t('coast.currentPlace')}</option>
                {BEACHES.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}, {b.state}
                  </option>
                ))}
              </select>
            </label>
            {beach?.ripProne ? <p className="ms-muted">{t('coast.ripProne')}</p> : null}
          </section>
          {view ? (
            <section className="ms-card" aria-labelledby="c-table">
              <h2 id="c-table">{fisher ? t('coast.next72') : t('coast.next48')}</h2>
              <SeaTable view={view} env={env} hours={fisher ? 72 : 48} big={fisher} />
            </section>
          ) : null}
          {!fisher ? <Tips id="c-tips" titleKey="coast.safetyTitle" listKey="coast.safetyTips" icon="fa-solid fa-life-ring" /> : null}
          {fisher ? <Tips id="c-fisher" titleKey="coast.fisherTitle" listKey="coast.fisherTips" icon="fa-solid fa-anchor" /> : null}
        </>
      )}
    </PersonaPage>
  );
}
