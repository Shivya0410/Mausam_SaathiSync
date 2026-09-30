"use client";

import { useEffect, useMemo, useState } from 'react';
import { stores, dismissedFor, personaList } from '../stores';
import { useStore } from './useStore';
import { useNow } from './useNow';
import { useWeather, usePersonas } from '../context/WeatherProvider';
import { personalView } from '../mausam/personal';
import { localParts, daysBetween } from '../mausam/time';
import { fetchSnapshot, snapshotUrl } from './useSnapshot';
import { coolSpotsNear } from '../../data/coolSpots';
import { AIRPORT_BY_ICAO } from '../../data/airports';
import { AVAILABLE_WIDGETS } from '../../components/widgets/available';

const tripKey = (trips) => trips.map((t) => `${t.id}:${t.from}:${t.to}:${t.destination?.lat}:${t.originAirport ?? ''}`).join('|');

/**
 * Weather at the destination (and origin airport) of trips within the
 * 16-day forecast, in the shape ctx.trips expects (see rules/travel.js).
 */
export function useTripData(trips, today, lang) {
  const [data, setData] = useState({});
  const key = tripKey(trips);
  useEffect(() => {
    if (!today) return undefined;
    let cancelled = false;
    const soon = trips.filter((t) => t.destination && t.to >= today && daysBetween(today, t.from) <= 16);
    Promise.all(
      soon.map(async (trip) => {
        const out = { destination: {}, origin: {} };
        try {
          const dest = await fetchSnapshot(snapshotUrl(trip.destination, { include: 'warnings', lang }));
          out.destination = {
            daily: dest.daily,
            elevationM: dest.place?.elevationM ?? null,
            isCoastal: Boolean(dest.place?.isCoastal),
            warnings: dest.warnings || [],
            warningsStatus: dest.warningsStatus,
          };
        } catch {
          // Destination weather unavailable: travel rules for it do not fire.
        }
        const airport = trip.originAirport && AIRPORT_BY_ICAO[trip.originAirport];
        if (airport) {
          try {
            const [origin, wx] = await Promise.all([
              fetchSnapshot(snapshotUrl({ lat: airport.lat, lon: airport.lon, name: airport.city }, { include: 'sun', lang })),
              fetch(`/api/mausam/airport?icao=${airport.icao}`).then((r) => (r.ok ? r.json() : null)),
            ]);
            out.origin = { hourly: origin.hourly, metar: wx?.airports?.[0]?.metar ?? null, taf: wx?.airports?.[0]?.taf ?? null };
          } catch {
            // Airport weather unavailable.
          }
        }
        return [trip.id, out];
      }),
    ).then((pairs) => {
      if (!cancelled) setData(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
    // `key` captures every trip field that matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, today, lang]);
  return data;
}

/** Climatology for events beyond the 16-day forecast (PRD 6.6.4). */
export function useClimatology(events, place, today) {
  const [data, setData] = useState({});
  const key = events.map((e) => `${e.id}:${e.date}`).join('|') + `@${place?.lat},${place?.lon}`;
  useEffect(() => {
    if (!today || !place) return undefined;
    let cancelled = false;
    const far = events.filter((e) => e.date >= today && daysBetween(today, e.date) > 16);
    Promise.all(
      far.map(async (e) => {
        const loc = e.place || place;
        const [, m, d] = e.date.split('-').map(Number);
        const p = new URLSearchParams({ lat: loc.lat.toFixed(2), lon: loc.lon.toFixed(2), month: String(m), day: String(d) });
        try {
          const r = await fetch(`/api/mausam/climatology?${p}`);
          return [e.id, r.ok ? await r.json() : null];
        } catch {
          return [e.id, null];
        }
      }),
    ).then((pairs) => {
      if (!cancelled) setData(Object.fromEntries(pairs.filter(([, v]) => v)));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, today]);
  return data;
}

/**
 * Personal view for the phone's owner, or for a household member when
 * `member` is given ({ personas: [ids], sensitivities: [] }).
 *
 * @returns {{ view, now, today, snapshot, status, place, personas, ready }}
 */
export function usePersonal({ member = null, snapshotOverride = null } = {}) {
  const weather = useWeather();
  const owner = usePersonas();
  const now = useNow();
  const [sensitivities] = useStore(stores.sensitivities);
  const [personaSettings] = useStore(stores.personaSettings);
  const [trips] = useStore(stores.trips);
  const [events] = useStore(stores.events);
  const [layout] = useStore(stores.layout);
  const [usage] = useStore(stores.usage);
  const [cardState] = useStore(stores.cardState);
  const snapshot = snapshotOverride || weather.snapshot;
  const offsetMin = (snapshot?.utcOffsetSeconds ?? 19800) / 60;
  const today = now ? localParts(now, offsetMin).date : null;
  const tripData = useTripData(trips, today, 'en');
  const climatology = useClimatology(events, weather.place, today);

  const personas = useMemo(
    () => (member ? personaList({ primary: member.personas?.[0], secondary: member.personas?.slice(1) || [] }) : owner.list),
    [member, owner.list],
  );
  const sens = useMemo(() => (member ? member.sensitivities || [] : sensitivities.list), [member, sensitivities.list]);
  const placeId = snapshot?.place?.id ?? weather.place.id;

  // Everything personalView needs except who the person is, so household
  // mode can build each member's view from the same inputs.
  const inputs = useMemo(() => {
    if (!snapshot || !now) return null;
    return {
      snapshot,
      now,
      personaSettings,
      places: weather.places,
      trips,
      events,
      reports: weather.reports.reports,
      coolSpots: coolSpotsNear(snapshot.place),
      tripData,
      climatology,
      layout,
      usage,
      dismissed: dismissedFor(cardState, today, placeId),
      availableWidgets: AVAILABLE_WIDGETS,
    };
  }, [snapshot, now, personaSettings, weather.places, trips, events, tripData, climatology, layout, usage, cardState, today, placeId, weather.reports.reports]);

  const view = useMemo(
    () => (inputs ? personalView({ ...inputs, personas, sensitivities: sens }) : null),
    [inputs, personas, sens],
  );

  const coolSpots = useMemo(() => coolSpotsNear(snapshot?.place), [snapshot?.place]);

  return {
    view,
    now,
    today,
    snapshot,
    status: weather.status,
    place: weather.place,
    places: weather.places,
    personas,
    personaSettings,
    trips,
    events,
    tripData,
    climatology,
    coolSpots,
    inputs,
    ready: Boolean(view),
  };
}
