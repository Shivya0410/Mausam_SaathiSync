// Traveller persona rules (PRD section 6.7, travel.*). Pure.
//
// Trips live in settings.travel.trips:
//   { id, name, from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', mode, departAt?: ISO,
//     originAirport?: 'VIDP' }
// Their weather is attached by the caller in ctx.trips[trip.id]:
//   { origin: { hourly, metar: { weather: ['FG'] } },
//     destination: { daily, elevationM, isCoastal, warnings } }

import { T } from '../thresholds.js';
import { daysBetween } from '../time.js';
import { packingList } from '../packing.js';

const HOUR = 3600 * 1000;

function trips(ctx) {
  return (ctx.settings.travel?.trips || [])
    .filter((t) => t.to >= ctx.dateKey)
    .sort((a, b) => a.from.localeCompare(b.from));
}

function tripDays(ctx, trip) {
  return (ctx.trips[trip.id]?.destination?.daily || []).filter((d) => d.date >= trip.from && d.date <= trip.to);
}

export const travelRules = [
  {
    id: 'travel.fogFlight',
    personas: ['travel'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      for (const trip of trips(ctx)) {
        if (!trip.originAirport || !trip.departAt) continue;
        const dep = Date.parse(trip.departAt);
        if (dep < ctx.nowMs || dep - ctx.nowMs > T.travel.fogHorizonHours * HOUR) continue;
        const origin = ctx.trips[trip.id]?.origin || {};
        const near = (origin.hourly || []).filter((h) => {
          const t = Date.parse(h.time);
          return t >= dep - 3 * HOUR && t <= dep + HOUR && h.visibilityM != null;
        });
        const low = near.filter((h) => h.visibilityM < T.fog.flightVisibilityM);
        const metarFog = (origin.metar?.weather || []).includes('FG');
        if (low.length || metarFog) {
          return {
            tripId: trip.id,
            airport: trip.originAirport,
            startsAt: low[0]?.time ?? trip.departAt,
            when: low[0]?.time ?? trip.departAt,
            visibilityM: low.length ? Math.min(...low.map((h) => h.visibilityM)) : null,
          };
        }
      }
      return null;
    },
    severity: () => 2,
    chips: [],
    source: ['aviation', 'forecast'],
  },
  {
    id: 'travel.destWarning',
    personas: ['travel'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      for (const trip of trips(ctx)) {
        const warnings = ctx.trips[trip.id]?.destination?.warnings || [];
        const hit = warnings
          .filter((w) => w.level >= 2)
          .filter((w) => {
            const from = (w.validFrom || '').slice(0, 10);
            const to = (w.validTo || '').slice(0, 10);
            return (!to || to >= trip.from) && (!from || from <= trip.to);
          })
          .sort((a, b) => b.level - a.level)[0];
        if (hit) {
          return {
            tripId: trip.id,
            place: trip.name,
            hazard: hit.hazard,
            level: hit.level,
            date: (hit.validFrom || trip.from).slice(0, 10),
          };
        }
      }
      return null;
    },
    severity: (m) => (m.level >= 4 ? 3 : 2),
    chips: [],
    source: ['warnings'],
  },
  {
    id: 'travel.pack',
    personas: ['travel'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const trip = trips(ctx).find((t) => daysBetween(ctx.dateKey, t.from) <= T.travel.packHorizonDays);
      if (!trip) return null;
      const dest = ctx.trips[trip.id]?.destination || {};
      const days = tripDays(ctx, trip);
      if (!days.length) return null;
      const items = packingList({ days, coastal: dest.isCoastal, elevationM: dest.elevationM });
      const top = items.filter((i) => i.reason !== 'always').slice(0, 3);
      return { tripId: trip.id, place: trip.name, items: (top.length ? top : items.slice(0, 3)).map((i) => i.id), all: items };
    },
    severity: () => 1,
    chips: [],
    source: ['forecast'],
  },
  {
    id: 'travel.hillRain',
    personas: ['travel'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      for (const trip of trips(ctx)) {
        const dest = ctx.trips[trip.id]?.destination || {};
        if (!(dest.elevationM > T.travel.hillElevationM)) continue;
        const wet = tripDays(ctx, trip).find((d) => d.precipMm >= T.rain.dayHeavyMm);
        if (wet) return { tripId: trip.id, place: trip.name, date: wet.date, mm: Math.round(wet.precipMm) };
      }
      return null;
    },
    severity: () => 2,
    chips: ['raincoat'],
    source: ['forecast'],
  },
];
