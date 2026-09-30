// Greeting and one-line summary (PRD section 5.4). Pure and language-
// neutral: returns keys and numbers, and the component renders the sentence.

import { localParts, sliceHours } from './time.js';
import { wmoWeight, isThunderCode, isFogCode } from './wmo.js';

export function greetingKey(hour) {
  if (hour >= 4 && hour < 12) return 'home.greeting.morning';
  if (hour >= 12 && hour < 17) return 'home.greeting.afternoon';
  if (hour >= 17 && hour < 21) return 'home.greeting.evening';
  return 'home.greeting.night';
}

/** Temperature band word for the day's high. */
export function tempBand(maxC) {
  if (!Number.isFinite(maxC)) return null;
  if (maxC >= 40) return 'veryHot';
  if (maxC >= 33) return 'hot';
  if (maxC >= 25) return 'warm';
  if (maxC >= 15) return 'mild';
  if (maxC >= 8) return 'cool';
  return 'cold';
}

/**
 * The first notable change in the next 12 hours: thunderstorm onset, rain
 * onset (probability >= 60%), a temperature drop of 5°C or more, fog onset.
 */
export function notableChange(hourly, now) {
  const hours = sliceHours(hourly, now, 12);
  if (!hours.length) return null;
  const t0 = hours[0].tempC;
  for (const h of hours.slice(1)) {
    if (isThunderCode(h.wmo)) return { type: 'thunder', time: h.time };
    if (h.precipProb >= 60 && (h.precipMm ?? 0) >= 0.1) return { type: 'rain', time: h.time };
    if (Number.isFinite(t0) && t0 - h.tempC >= 5) return { type: 'cooler', time: h.time };
    if (isFogCode(h.wmo) || (h.visibilityM != null && h.visibilityM < 1000)) return { type: 'fog', time: h.time };
  }
  return null;
}

/**
 * @param {object} snapshot WeatherSnapshot
 * @param {Date|number} now
 * @param {object} [opts] { name, offsetMin }
 * @returns {{ greetingKey, name, placeName, conditionKey, tempBand, humid, change }}
 */
export function summarize(snapshot, now, { name = null, offsetMin } = {}) {
  const off = offsetMin ?? (snapshot?.utcOffsetSeconds ?? 19800) / 60;
  const p = localParts(now, off);
  const today = snapshot?.daily?.find((d) => d.date === p.date) || snapshot?.daily?.[0] || null;
  const todayHours = (snapshot?.hourly || []).filter((h) => h.time.startsWith(p.date));
  const dominant = todayHours.length
    ? todayHours.reduce((a, b) => (wmoWeight(b.wmo) > wmoWeight(a.wmo) ? b : a)).wmo
    : today?.wmo ?? null;
  const humid = todayHours.length ? Math.max(...todayHours.map((h) => h.rh ?? 0)) >= 70 : false;
  return {
    greetingKey: greetingKey(p.hour),
    name: name && String(name).trim() ? String(name).trim().slice(0, 20) : null,
    placeName: snapshot?.place?.name ?? null,
    conditionKey: dominant != null ? `wmo.${dominant}` : null,
    tempBand: tempBand(today?.maxC),
    humid,
    change: notableChange(snapshot?.hourly || [], now),
  };
}
