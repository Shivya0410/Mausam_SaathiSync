// Builds the context object every rule receives (PRD section 6.3). Pure:
// `now` is always passed in, never read from the clock.

import { localParts, sliceHours, addDays, offsetOfIso, toMs, IST_OFFSET_MIN } from '../time.js';
import { T } from '../thresholds.js';

/**
 * @param {object} input
 * @param {Date|number|string} input.now
 * @param {object} input.snapshot WeatherSnapshot (section 12.3)
 * @param {string[]} [input.personas] primary first
 * @param {string[]} [input.sensitivities]
 * @param {object} [input.settings] per-persona settings
 * @param {Array} [input.reports] nearby crowd reports
 * @param {Array} [input.savedPlaces] [{ id, name, lat, lon, type }]
 * @param {Array} [input.coolSpots] [{ name, lat, lon, type }]
 * @param {object} [input.trips] { [tripId]: { origin:{hourly,metar}, destination:{daily,elevationM,isCoastal,warnings} } }
 * @param {object} [input.climatology] { [eventId]: { rainyYears, yearsCounted } }
 * @param {Array} [input.lightningStrikes] [{ lat, lon, time }]
 */
export function buildContext(input) {
  const { snapshot } = input;
  const nowMs = toMs(input.now);
  const offsetMin =
    snapshot?.utcOffsetSeconds != null
      ? snapshot.utcOffsetSeconds / 60
      : offsetOfIso(snapshot?.hourly?.[0]?.time) ?? IST_OFFSET_MIN;
  const local = localParts(nowMs, offsetMin);
  const hourly = snapshot?.hourly || [];
  const daily = snapshot?.daily || [];
  const personas = input.personas?.length ? input.personas : ['citizen'];
  const warnings = (input.officialWarnings ?? snapshot?.warnings ?? []).filter(
    (w) => !w.validTo || Date.parse(w.validTo) > nowMs,
  );

  const ctx = {
    now: new Date(nowMs),
    nowMs,
    offsetMin,
    local,
    dateKey: local.date,
    place: snapshot?.place || { id: 'current' },
    personas,
    sensitivities: input.sensitivities || [],
    settings: input.settings || {},
    snapshot,
    hourly,
    daily,
    air: snapshot?.air || null,
    marine: snapshot?.marine || null,
    officialWarnings: warnings,
    reports: input.reports || [],
    savedPlaces: input.savedPlaces || [],
    coolSpots: input.coolSpots || [],
    trips: input.trips || {},
    climatology: input.climatology || {},
    lightningStrikes: input.lightningStrikes || [],

    /** Hourly records from the start of the hour containing `from`, for `hours`. */
    window(from, hours) {
      return sliceHours(hourly, from, hours);
    },
    /** Daily record for today + offset (local date). */
    day(offset = 0) {
      const date = addDays(local.date, offset);
      return daily.find((d) => d.date === date) || null;
    },
    /** Hourly records on a local date. */
    hoursOn(date) {
      return hourly.filter((h) => h.time.startsWith(date));
    },
    /** Nearest hourly record to an instant (within 90 minutes). */
    hourAt(instant) {
      const t = toMs(instant);
      let best = null;
      for (const h of hourly) {
        const d = Math.abs(Date.parse(h.time) - t);
        if (d <= 90 * 60 * 1000 && (!best || d < best.d)) best = { h, d };
      }
      return best ? best.h : null;
    },
    /** AQI for an hour, falling back to the current AQI. */
    aqiOf(hour) {
      return hour?.aqi ?? snapshot?.air?.aqi ?? null;
    },
    has(persona) {
      return personas.includes(persona);
    },
    hasSensitivity(...list) {
      return list.some((s) => ctx.sensitivities.includes(s));
    },
    /** Active official warnings whose hazard is in `hazards` (or any, if omitted). */
    warningsFor(hazards) {
      return warnings.filter((w) => !hazards || hazards.includes(w.hazard));
    },
    /** Official IMD nowcast for thunderstorm or lightning is active. */
    thunderNowcast() {
      return warnings.some(
        (w) => w.source === 'imd_nowcast' && ['thunderstorm', 'lightning', 'squall'].includes(w.hazard),
      );
    },
  };
  ctx.T = T;
  return ctx;
}
