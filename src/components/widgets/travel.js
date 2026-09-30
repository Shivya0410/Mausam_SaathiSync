"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { WidgetShell, NotAvailable } from './shared';
import WeatherIcon from '../shared/WeatherIcon';
import LevelBadge from '../shared/LevelBadge';
import { fmtDate, fmtTemp, fmtVisibility, fmtWeekday } from '../../lib/format';
import { daysBetween } from '../../lib/mausam/time';
import { packingList } from '../../lib/mausam/packing';
import { levelName } from '../../lib/mausam/hazards';
import { fetchSnapshot, snapshotUrl } from '../../lib/hooks/useSnapshot';
import { stores } from '../../lib/stores';
import { useStore } from '../../lib/hooks/useStore';
import { AIRPORT_BY_ICAO } from '../../data/airports';

export function nextTripOf(personal, today) {
  return (personal?.trips || []).filter((t) => t.to >= today).sort((a, b) => a.from.localeCompare(b.from))[0] || null;
}

const AddTrip = () => {
  const { t } = useTranslation();
  return <Link href="/travel">{t('widgets.nextTrip.add')}</Link>;
};

// ── Next trip ──
export function NextTripWidget({ env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const trip = nextTripOf(env.personal, env.today);
  if (!trip) {
    return (
      <WidgetShell id="nextTrip" icon="fa-solid fa-suitcase-rolling">
        <NotAvailable messageKey="empty.trips" action={<AddTrip />} />
      </WidgetShell>
    );
  }
  const data = env.personal?.tripData?.[trip.id]?.destination;
  const days = (data?.daily || []).filter((d) => d.date >= trip.from && d.date <= trip.to);
  const warnings = (data?.warnings || []).filter((w) => w.level >= 2);
  const inDays = daysBetween(env.today, trip.from);
  return (
    <WidgetShell id="nextTrip" icon="fa-solid fa-suitcase-rolling" more={{ href: '/travel', label: t('widgets.nextTrip.more') }}>
      <p className="ms-widget-lead">
        {trip.name} · {fmtDate(trip.from, lang)}–{fmtDate(trip.to, lang)} ·{' '}
        {inDays > 0 ? t('widgets.nextTrip.inDays', { count: inDays }) : t('widgets.nextTrip.onTrip')}
      </p>
      {warnings.length ? (
        <p>
          <LevelBadge level={levelName(warnings[0].level)} /> {t(`hazards.${warnings[0].hazard}`, { defaultValue: warnings[0].title })}
        </p>
      ) : null}
      {days.length ? (
        <ol className="ms-strip ms-strip--compact">
          {days.map((d) => (
            <li key={d.date} className="ms-strip-item">
              <span className="ms-strip-time">{fmtWeekday(d.date, lang)}</span>
              <WeatherIcon code={d.wmo} size={24} />
              <span className="visually-hidden">{t(`wmo.${d.wmo}`)}</span>
              <span className="ms-strip-temp">
                {fmtTemp(d.maxC)}/{fmtTemp(d.minC)}
              </span>
              <span className="ms-strip-rain">{d.precipProbMax}%</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="ms-muted">{t('widgets.nextTrip.beyondForecast')}</p>
      )}
    </WidgetShell>
  );
}

/** Current conditions for saved places other than the current one. */
export function usePlacesNow(places, lang) {
  const [data, setData] = useState({});
  const key = places.map((p) => `${p.id}:${p.lat}:${p.lon}`).join('|');
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      places.slice(0, 8).map((p) =>
        fetchSnapshot(snapshotUrl(p, { include: 'warnings', lang }))
          .then((s) => [p.id, { temp: s.current?.tempC, wmo: s.current?.wmo, isDay: s.current?.isDay, level: Math.max(0, ...(s.warnings || []).map((w) => w.level)) }])
          .catch(() => [p.id, null]),
      ),
    ).then((pairs) => {
      if (!cancelled) setData(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, lang]);
  return data;
}

// ── Saved places ──
export function SavedPlacesWidget({ env }) {
  const { t, i18n } = useTranslation();
  const places = env.personal?.places || [];
  const others = places.filter((p) => p.id !== env.snapshot.place?.id).slice(0, 8);
  const nowData = usePlacesNow(others, i18n.language === 'hi' ? 'hi' : 'en');
  if (!others.length) {
    return (
      <WidgetShell id="savedPlaces" icon="fa-solid fa-location-dot">
        <NotAvailable messageKey="widgets.savedPlaces.none" action={<Link href="/settings#places">{t('widgets.savedPlaces.add')}</Link>} />
      </WidgetShell>
    );
  }
  return (
    <WidgetShell id="savedPlaces" icon="fa-solid fa-location-dot">
      <ul className="ms-place-cards">
        {others.map((p) => {
          const d = nowData[p.id];
          return (
            <li key={p.id}>
              <Link href={`/forecast?place=${encodeURIComponent(p.id)}`} className="ms-place-card">
                <span className="ms-place-name">{i18n.language === 'hi' && p.nameHi ? p.nameHi : p.name}</span>
                {d ? (
                  <>
                    <WeatherIcon code={d.wmo} isDay={d.isDay} size={22} />
                    <span className="ms-place-temp">{fmtTemp(d.temp)}</span>
                    {d.level >= 2 ? <LevelBadge level={levelName(d.level)} /> : null}
                  </>
                ) : (
                  <span className="ms-muted">…</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </WidgetShell>
  );
}

// ── Flight weather (airport weather, not flight status) ──
export function FlightWeatherWidget({ env }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const trip = (env.personal?.trips || []).find((x) => x.originAirport && x.to >= env.today);
  const origin = trip ? env.personal?.tripData?.[trip.id]?.origin : null;
  if (!trip || !origin?.metar) {
    return (
      <WidgetShell id="flightWeather" icon="fa-solid fa-plane-departure">
        <NotAvailable messageKey="widgets.flightWeather.none" action={<AddTrip />} />
      </WidgetShell>
    );
  }
  const m = origin.metar;
  const airport = AIRPORT_BY_ICAO[trip.originAirport];
  const words = m.words.length ? m.words.map((w) => t(`metar.${w}`)).join(', ') : t('metar.clear');
  return (
    <WidgetShell id="flightWeather" icon="fa-solid fa-plane-departure" source={t('sources.aviationweather')}>
      <p className="ms-widget-lead">
        {airport ? `${airport.city} (${airport.iata})` : trip.originAirport}: {words} · {t('widgets.flightWeather.visibility', { vis: fmtVisibility(m.visibilityM, lang) })}
      </p>
      {origin.taf?.fog ? <p>{t('widgets.flightWeather.tafFog', { vis: fmtVisibility(origin.taf.minVisibilityM, lang) })}</p> : null}
      <p className="ms-muted">{t('widgets.flightWeather.notStatus')}</p>
    </WidgetShell>
  );
}

// ── Packing list (tickable, stored on this device) ──
export function PackingListWidget({ env }) {
  const { t } = useTranslation();
  const [ticks, setTicks] = useStore(stores.packing);
  const trip = nextTripOf(env.personal, env.today);
  const data = trip ? env.personal?.tripData?.[trip.id]?.destination : null;
  const days = (data?.daily || []).filter((d) => d.date >= trip?.from && d.date <= trip?.to);
  if (!trip || !days.length) {
    return (
      <WidgetShell id="packingList" icon="fa-solid fa-list-check">
        <NotAvailable messageKey="widgets.packingList.none" action={<AddTrip />} />
      </WidgetShell>
    );
  }
  const items = packingList({ days, coastal: data.isCoastal, elevationM: data.elevationM });
  const done = ticks[trip.id] || {};
  const toggle = (id) =>
    setTicks((prev) => ({ ...prev, [trip.id]: { ...(prev[trip.id] || {}), [id]: !(prev[trip.id] || {})[id] } }));
  return (
    <WidgetShell id="packingList" icon="fa-solid fa-list-check">
      <p className="ms-muted">{t('widgets.packingList.for', { place: trip.name })}</p>
      <ul className="ms-checklist">
        {items.map((i) => (
          <li key={i.id}>
            <label>
              <input type="checkbox" checked={Boolean(done[i.id])} onChange={() => toggle(i.id)} />
              <span>
                {t(`packing.${i.id}`)} <span className="ms-muted">· {t(`packingWhy.${i.reason}`, i.params || {})}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </WidgetShell>
  );
}
