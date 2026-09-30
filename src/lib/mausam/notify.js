// Which official warnings should raise a local notification (PRD 7.4).
// Pure. Push notifications (Phase 2 / Part 3) will reuse the same rules.

import { localParts, minutesOfClock } from './time.js';

export const MAX_PER_DAY = 6;

/** Whether local time falls in quiet hours (spanning midnight is allowed). */
export function inQuietHours(now, offsetMin, from = '22:00', to = '06:00') {
  const p = localParts(now, offsetMin);
  const m = p.hour * 60 + p.minute;
  const a = minutesOfClock(from);
  const b = minutesOfClock(to);
  if (a == null || b == null || a === b) return false;
  return a < b ? m >= a && m < b : m >= a || m < b;
}

/**
 * @param {Array} warnings active official warnings for the user's place
 * @param {object} settings notify store value
 * @param {number} now ms
 * @param {number} offsetMin
 * @returns {{ toSend: Array, seen: string[], sentToday: {date, count} }}
 *   `seen` includes every loud warning considered, so each is announced once.
 */
export function pickNotifications(warnings, settings, now, offsetMin = 330) {
  const today = localParts(now, offsetMin).date;
  const sent = settings.sentToday?.date === today ? settings.sentToday.count : 0;
  const seen = new Set(settings.seen || []);
  const minLevel = settings.yellow ? 2 : 3;
  const quiet = inQuietHours(now, offsetMin, settings.quietFrom, settings.quietTo);
  const toSend = [];
  let count = sent;
  const loud = (warnings || [])
    .filter((w) => w.level >= minLevel && !w.demo)
    .sort((a, b) => b.level - a.level);
  for (const w of loud) {
    // An upgrade (Orange to Red) is a new announcement.
    const key = `${w.id}@${w.level}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!settings.official) continue;
    const red = w.level >= 4;
    if (quiet && !red) continue;
    if (count >= MAX_PER_DAY && !red) continue;
    toSend.push(w);
    count += 1;
  }
  return { toSend, seen: [...seen].slice(-200), sentToday: { date: today, count } };
}

/** Default rain and lightning alerts depend on personas (PRD 7.4). */
export function effectiveNotify(settings, personaIds) {
  const rainPersonas = ['commute', 'family', 'work', 'farm'];
  const outdoor = ['fitness', 'coast', 'fisher', 'farm', 'commute', 'work', 'events', 'family'];
  return {
    ...settings,
    rainHour: settings.rainHour ?? personaIds.some((p) => rainPersonas.includes(p)),
    lightning: settings.lightning ?? personaIds.some((p) => outdoor.includes(p)),
  };
}
