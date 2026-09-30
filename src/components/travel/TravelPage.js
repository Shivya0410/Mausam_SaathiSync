"use client";

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PersonaPage from '../persona/PersonaPage';
import PlaceSearch from '../places/PlaceSearch';
import { ChipGroup } from '../persona/Sections';
import ExternalLink from '../shared/ExternalLink';
import { useStore } from '../../lib/hooks/useStore';
import { stores, toPlace, upsertById, removeById, newId } from '../../lib/stores';
import { AIRPORTS } from '../../data/airports';
import { fmtDate } from '../../lib/format';
import { daysBetween } from '../../lib/mausam/time';

// Hill and pilgrimage destinations that get landslide and route notes (PRD 8.4).
const HILL_ROUTES = ['kedarnath', 'badrinath', 'gangotri', 'yamunotri', 'amarnath', 'vaishno', 'katra', 'sabarimala', 'tawang', 'leh', 'shimla', 'manali', 'darjeeling', 'gangtok', 'munnar', 'ooty'];

const EMPTY = { destination: null, from: '', to: '', mode: 'flight', originAirport: '' };

/** Travel (PRD 8.4): trips, destination weather, airport weather, packing. */
export default function TravelPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [trips, setTrips] = useStore(stores.trips);
  const [draft, setDraft] = useState(EMPTY);
  const [error, setError] = useState(null);

  const save = (e) => {
    e.preventDefault();
    if (!draft.destination) return setError('destination');
    if (!draft.from || !draft.to || draft.to < draft.from) return setError('dates');
    setTrips((list) =>
      upsertById(list, {
        id: newId('trip'),
        name: draft.destination.name,
        destination: draft.destination,
        from: draft.from,
        to: draft.to,
        mode: draft.mode,
        originAirport: draft.mode === 'flight' ? draft.originAirport || null : null,
        departAt: draft.mode === 'flight' && draft.originAirport ? `${draft.from}T07:00:00+05:30` : null,
      }),
    );
    setDraft(EMPTY);
    setError(null);
  };

  return (
    <PersonaPage persona="travel" pageKey="travel" hero="nextTrip" widgets={['flightWeather', 'packingList', 'savedPlaces']} services={['imd']} learn={['fog', 'monsoonKit']}>
      {({ env }) => {
        const today = env.today;
        const upcoming = trips.filter((x) => !today || x.to >= today);
        const hill = upcoming.find((x) => HILL_ROUTES.some((h) => x.name.toLowerCase().includes(h)) || (env.personal?.tripData?.[x.id]?.destination?.elevationM ?? 0) > 1000);
        return (
          <>
            <section className="ms-card" aria-labelledby="t-trips">
              <h2 id="t-trips">{t('travel.trips')}</h2>
              {upcoming.length ? (
                <ul className="ms-list ms-list--plain">
                  {upcoming.map((x) => (
                    <li key={x.id} className="ms-row">
                      <span>
                        <strong>{x.name}</strong> · {fmtDate(x.from, lang)}–{fmtDate(x.to, lang)} · {t(`travel.modes.${x.mode}`)}
                        {x.originAirport ? ` · ${x.originAirport}` : ''}
                        {today && x.from > today ? ` · ${t('widgets.nextTrip.inDays', { count: daysBetween(today, x.from) })}` : ''}
                      </span>
                      <button type="button" className="ms-chip-btn" onClick={() => setTrips((l) => removeById(l, x.id))} aria-label={t('travel.remove', { name: x.name })}>
                        <i className="fa-solid fa-trash" aria-hidden="true"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ms-muted">{t('empty.trips')}</p>
              )}
              <form onSubmit={save} className="ms-form" noValidate aria-labelledby="t-add">
                <h3 id="t-add">{t('travel.add')}</h3>
                <PlaceSearch labelKey="onboarding.details.destination" onSelect={(r) => setDraft((d) => ({ ...d, destination: toPlace(r) }))} />
                {draft.destination ? <p className="ms-muted">{t('onboarding.details.chosen', { name: draft.destination.name })}</p> : null}
                <div className="ms-row-fields">
                  <label className="ms-field">
                    <span>{t('onboarding.details.from')}</span>
                    <input type="date" value={draft.from} min={today || undefined} onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))} aria-describedby={error === 'dates' ? 't-err' : undefined} />
                  </label>
                  <label className="ms-field">
                    <span>{t('onboarding.details.to')}</span>
                    <input type="date" value={draft.to} min={draft.from || today || undefined} onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))} aria-describedby={error === 'dates' ? 't-err' : undefined} />
                  </label>
                </div>
                <ChipGroup label={t('travel.mode')} options={['flight', 'train', 'road', 'other'].map((m) => ({ value: m, label: t(`travel.modes.${m}`) }))} value={draft.mode} onChange={(v) => setDraft((d) => ({ ...d, mode: v }))} />
                {draft.mode === 'flight' ? (
                  <label className="ms-field">
                    <span>{t('onboarding.details.airport')}</span>
                    <select value={draft.originAirport} onChange={(e) => setDraft((d) => ({ ...d, originAirport: e.target.value }))}>
                      <option value="">{t('travel.noAirport')}</option>
                      {AIRPORTS.map((a) => (
                        <option key={a.icao} value={a.icao}>
                          {a.city} ({a.iata}) · {a.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {error ? <p id="t-err" className="ms-error" role="alert">{t(`travel.errors.${error}`)}</p> : null}
                <button type="submit" className="ms-btn">
                  <i className="fa-solid fa-plus" aria-hidden="true"></i> {t('travel.save')}
                </button>
              </form>
            </section>
            {hill ? (
              <section className="ms-card" aria-labelledby="t-hill">
                <h2 id="t-hill">{t('travel.hillTitle', { place: hill.name })}</h2>
                <p>{t('travel.hillNote')}</p>
                <ExternalLink href="https://ndma.gov.in">{t('travel.sdmaLink')}</ExternalLink>
              </section>
            ) : null}
            <section className="ms-card" aria-labelledby="t-roads">
              <h2 id="t-roads">{t('travel.roads')}</h2>
              <p>{t('travel.roadsNote')}</p>
            </section>
          </>
        );
      }}
    </PersonaPage>
  );
}
