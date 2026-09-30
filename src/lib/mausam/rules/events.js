// Event planner (events.*) and outdoor worker (work.*) rules
// (PRD section 6.7). Pure.
//
// settings.events: { events: [{ id, name, date: 'YYYY-MM-DD', slot, outdoor }] }
// settings.work: { hours: ['09:00', '19:00'], type: 'delivery'|'construction'|'vending'|'other' }

import { T } from '../thresholds.js';
import { daysBetween, hourOfIso, minutesOfClock } from '../time.js';
import { comfortIndex, comfortBand, slotConditions, SLOTS } from '../indices/comfortIndex.js';
import { haversineKm } from '../geo.js';
import { endOfHour } from '../indices/windows.js';

function upcomingEvents(ctx) {
  return (ctx.settings.events?.events || [])
    .filter((e) => e.date >= ctx.dateKey)
    .map((e) => ({ ...e, inDays: daysBetween(ctx.dateKey, e.date) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Slot conditions for an event, from hourly data if it reaches, else daily. */
export function eventConditions(ctx, event) {
  const [from, to] = SLOTS[event.slot] || SLOTS.evening;
  const hours = ctx.hoursOn(event.date).filter((h) => {
    const hr = hourOfIso(h.time);
    return hr >= from && hr < to;
  });
  const day = ctx.daily.find((d) => d.date === event.date) || null;
  return slotConditions({ hours, day, aqi: ctx.air?.aqi ?? null, outdoor: event.outdoor !== false });
}

function withinForecast(e) {
  return e.inDays <= T.events.forecastHorizonDays;
}

/** Work hours today as [startMs, endMs). */
function workSpan(ctx) {
  const [a, b] = ctx.settings.work?.hours || [];
  const from = minutesOfClock(a);
  const to = minutesOfClock(b);
  if (from == null || to == null) return null;
  return { from: from / 60, to: to / 60 };
}

function workHoursToday(ctx) {
  const span = workSpan(ctx);
  if (!span) return [];
  return ctx.hoursOn(ctx.dateKey).filter((h) => {
    const hr = hourOfIso(h.time);
    return hr >= span.from && hr < span.to && Date.parse(h.time) >= ctx.nowMs - 3600e3;
  });
}

export function heatDangerSpan(ctx) {
  const hot = workHoursToday(ctx).filter((h) => h.feelsC >= T.heat.workDangerHi);
  if (!hot.length) return null;
  return {
    start: hot[0].time,
    end: endOfHour(hot[hot.length - 1].time),
    hi: Math.round(Math.max(...hot.map((h) => h.feelsC))),
  };
}

export const eventRules = [
  {
    id: 'events.rainRisk',
    personas: ['events'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      for (const e of upcomingEvents(ctx).filter(withinForecast)) {
        const c = eventConditions(ctx, e);
        if (c && c.precipProbMax >= T.rain.eventProb) return { eventId: e.id, event: e.name, date: e.date, prob: Math.round(c.precipProbMax) };
      }
      return null;
    },
    severity: () => 2,
    chips: ['umbrella'],
    source: ['forecast'],
  },
  {
    id: 'events.wind',
    personas: ['events'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      for (const e of upcomingEvents(ctx).filter(withinForecast)) {
        const c = eventConditions(ctx, e);
        if (c && c.gustMax >= T.wind.strongGustEvents) return { eventId: e.id, event: e.name, date: e.date, gust: Math.round(c.gustMax) };
      }
      return null;
    },
    severity: () => 2,
    chips: [],
    source: ['forecast'],
  },
  {
    id: 'events.comfort',
    personas: ['events'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const e = upcomingEvents(ctx).find(withinForecast);
      if (!e) return null;
      const c = eventConditions(ctx, e);
      if (!c) return null;
      const score = comfortIndex(c);
      return { eventId: e.id, event: e.name, date: e.date, score, band: comfortBand(score) };
    },
    severity: () => 1,
    chips: [],
    source: ['forecast', 'air'],
  },
  {
    id: 'events.climatology',
    personas: ['events'],
    kind: 'tip',
    hazard: null,
    when(ctx) {
      const e = upcomingEvents(ctx).find((x) => !withinForecast(x) && ctx.climatology[x.id]);
      if (!e) return null;
      const c = ctx.climatology[e.id];
      return { eventId: e.id, event: e.name, date: e.date, n: c.rainyYears, years: c.yearsCounted };
    },
    severity: () => 1,
    chips: [],
    source: ['climatology'],
  },
];

export const workRules = [
  {
    id: 'work.heatDanger',
    personas: ['work'],
    kind: 'tip',
    hazard: 'heat',
    when(ctx) {
      const span = heatDangerSpan(ctx);
      return span ? { ...span, startsAt: span.start } : null;
    },
    severity: () => 3,
    chips: ['water', 'cap'],
    source: ['forecast'],
  },
  {
    id: 'work.coolSpot',
    personas: ['work'],
    kind: 'tip',
    // Not a hazard tip: where to rest stays useful next to an official heat card.
    hazard: null,
    when(ctx) {
      if (!heatDangerSpan(ctx)) return null;
      const here = ctx.place;
      if (!Number.isFinite(here?.lat)) return null;
      const near = ctx.coolSpots
        .map((s) => ({ s, d: haversineKm(here, s) }))
        .filter((x) => x.d <= T.reports.coolSpotKm)
        .sort((a, b) => a.d - b.d)[0];
      return near ? { name: near.s.name, distanceM: Math.round(near.d * 1000), type: near.s.type } : null;
    },
    severity: () => 1,
    chips: ['water'],
    source: ['coolSpots'],
  },
  {
    id: 'work.lightning30',
    personas: ['work', 'fisher', 'farm', 'fitness'],
    kind: 'tip',
    // Own group: the 30-30 takeover must run even under an official nowcast.
    hazard: 'thunder_now',
    when(ctx) {
      const here = ctx.place;
      const recent = ctx.lightningStrikes.filter(
        (s) =>
          ctx.nowMs - Date.parse(s.time) <= T.lightning.waitMinutes * 60000 &&
          Number.isFinite(here?.lat) &&
          haversineKm(here, s) <= T.lightning.radiusKm,
      );
      if (recent.length) {
        const last = recent.reduce((a, b) => (Date.parse(b.time) > Date.parse(a.time) ? b : a));
        return { source: 'strikes', lastStrike: last.time, takeover: true };
      }
      return ctx.thunderNowcast() ? { source: 'nowcast', takeover: true } : null;
    },
    severity: () => 3,
    chips: [],
    source: ['warnings'],
  },
  {
    id: 'work.heavyRainRiding',
    personas: ['work'],
    kind: 'tip',
    hazard: 'rain_heavy',
    when(ctx) {
      if (ctx.settings.work?.type !== 'delivery') return null;
      const hit = workHoursToday(ctx).find((h) => h.precipMm >= T.rain.ridingMmPerHour);
      return hit ? { startsAt: hit.time, when: hit.time, mm: hit.precipMm } : null;
    },
    severity: () => 2,
    chips: ['raincoat'],
    source: ['forecast'],
  },
];
