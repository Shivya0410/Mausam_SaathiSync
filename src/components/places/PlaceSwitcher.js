"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Dialog from '../shared/Dialog';
import PlaceSearch from './PlaceSearch';
import { useWeather } from '../../lib/context/WeatherProvider';
import { useGeolocation } from '../../lib/hooks/useGeolocation';
import { toPlace, upsertPlace } from '../../lib/stores';
import { CITIES } from '../../data/cities';
import { haversineKm } from '../../lib/mausam/geo';

/** Label for a GPS fix: the nearest known city within 25 km, else "Current location". */
export function gpsPlace(coords, t) {
  const near = CITIES.map((c) => ({ c, d: haversineKm(coords, c) })).sort((a, b) => a.d - b.d)[0];
  const city = near && near.d <= 25 ? near.c : null;
  return toPlace(
    {
      id: 'gps',
      name: city ? t('places.nearCity', { city: city.name }) : t('places.currentLocation'),
      nameHi: city ? `${city.nameHi} के पास` : null,
      lat: coords.lat,
      lon: coords.lon,
      state: city?.state ?? null,
      district: city?.name ?? null,
    },
    { type: 'other', id: 'gps' },
  );
}

/**
 * Place switcher in the top bar (PRD 5.3, 20.2): current location, saved
 * places, search, and a link to manage places. Location is asked for only
 * when the user taps "Use my location".
 */
export default function PlaceSwitcher() {
  const { t, i18n } = useTranslation();
  const { place, places, setPlaces, setCurrentPlace, demo, snapshot } = useWeather();
  const geo = useGeolocation();
  const [open, setOpen] = useState(false);
  const hi = i18n.language === 'hi';
  const shown = demo && snapshot?.place ? snapshot.place : place;
  const name = hi && shown.nameHi ? shown.nameHi : shown.name;

  const select = (p) => {
    setPlaces((list) => upsertPlace(list, p));
    setCurrentPlace(p.id);
    setOpen(false);
  };
  const useLocation = async () => {
    const coords = await geo.request();
    if (coords) select(gpsPlace(coords, t));
  };

  return (
    <>
      <button type="button" className="ms-place-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
        <span className="ms-place-btn-name">{name}</span>
        <span className="visually-hidden">{t('places.change')}</span>
        <i className="fa-solid fa-caret-down" aria-hidden="true"></i>
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t('places.title')}>
        {demo ? <p className="ms-muted">{t('places.demoNote')}</p> : null}
        <button type="button" className="ms-btn ms-btn--secondary ms-btn--block" onClick={useLocation} disabled={geo.status === 'loading'}>
          <i className="fa-solid fa-location-crosshairs" aria-hidden="true"></i> {geo.status === 'loading' ? t('places.locating') : t('places.useMyLocation')}
        </button>
        <p className="ms-muted">{t('onboarding.locationWhy')}</p>
        {geo.status === 'error' ? <p role="alert">{t(geo.error === 'denied' ? 'errors.locationDenied' : 'places.locationUnavailable')}</p> : null}
        {places.length ? (
          <>
            <h3 className="ms-sheet-sub">{t('places.saved')}</h3>
            <ul className="ms-sheet-list ms-sheet-list--rows">
              {places.map((p) => (
                <li key={p.id}>
                  <button type="button" className={`ms-row-btn ${p.id === place.id ? 'is-current' : ''}`} aria-current={p.id === place.id ? 'true' : undefined} onClick={() => select(p)}>
                    <i className="fa-solid fa-location-dot" aria-hidden="true"></i> {hi && p.nameHi ? p.nameHi : p.name}
                    {p.type !== 'other' ? <span className="ms-muted"> · {t(`places.types.${p.type}`)}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <PlaceSearch onSelect={(r) => select(toPlace(r))} />
        <p>
          <Link href="/settings#places" onClick={() => setOpen(false)}>
            {t('places.manage')}
          </Link>
        </p>
      </Dialog>
    </>
  );
}
