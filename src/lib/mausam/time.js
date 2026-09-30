// Time helpers. Pure.
//
// Weather data carries local times as ISO strings with the place's offset
// ("2026-09-29T16:00:00+05:30"). JavaScript Dates have no timezone, so
// anything "local" (hour of day, calendar date) is computed from an instant
// plus an explicit UTC offset rather than from the machine's timezone.

const HOUR_MS = 3600 * 1000;
export const IST_OFFSET_MIN = 330;

/** Offset in minutes from an ISO string ("+05:30" -> 330, "Z" -> 0). */
export function offsetOfIso(iso) {
  const m = /([+-])(\d{2}):?(\d{2})$/.exec(iso || '');
  if (!m) return /Z$/.test(iso || '') ? 0 : null;
  const mins = Number(m[2]) * 60 + Number(m[3]);
  return m[1] === '-' ? -mins : mins;
}

export function toMs(value) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return Date.parse(value);
}

const pad = (n) => String(n).padStart(2, '0');

/** Local calendar parts of an instant at a UTC offset. */
export function localParts(instant, offsetMin = IST_OFFSET_MIN) {
  const d = new Date(toMs(instant) + offsetMin * 60 * 1000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: d.getUTCDay(),
    date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
  };
}

/** ISO string with offset for an instant ("2026-09-29T16:00:00+05:30"). */
export function isoAt(instant, offsetMin = IST_OFFSET_MIN) {
  const p = localParts(instant, offsetMin);
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const d = new Date(toMs(instant) + offsetMin * 60 * 1000);
  return `${p.date}T${pad(p.hour)}:${pad(p.minute)}:${pad(d.getUTCSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

/** Local hour (0 to 23) read straight from an ISO string with offset. */
export function hourOfIso(iso) {
  return Number(iso.slice(11, 13));
}

/** Local calendar date (YYYY-MM-DD) from an ISO string with offset. */
export function dateOfIso(iso) {
  return iso.slice(0, 10);
}

/** Minutes since local midnight from "HH:MM". */
export function minutesOfClock(clock) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(clock || '');
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/**
 * The next instant (ms) at which the local clock shows `clock`, at or after
 * `now` minus `graceMin` minutes (so a departure 10 minutes ago still counts
 * as "the next one" rather than jumping to tomorrow).
 */
export function nextClockTime(clock, now, offsetMin = IST_OFFSET_MIN, graceMin = 0) {
  const target = minutesOfClock(clock);
  if (target == null) return null;
  const nowMs = toMs(now);
  const p = localParts(nowMs, offsetMin);
  const midnightLocalMs = nowMs - (p.hour * 60 + p.minute) * 60 * 1000 - (nowMs % 60000);
  let t = midnightLocalMs + target * 60 * 1000;
  if (t < nowMs - graceMin * 60 * 1000) t += 24 * HOUR_MS;
  return t;
}

/** Instant (ms) for a local date + clock at an offset. */
export function instantOf(date, clock, offsetMin = IST_OFFSET_MIN) {
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  return Date.parse(`${date}T${clock}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`);
}

/** Add whole days to a YYYY-MM-DD date. */
export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from date a to date b (YYYY-MM-DD). */
export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / (24 * HOUR_MS));
}

/** Start of the hour containing an instant (ms). Offsets are whole minutes. */
export function floorHour(instant) {
  const ms = toMs(instant);
  return ms - (ms % HOUR_MS);
}

/**
 * Time of day (PRD section 5.11): morning 04:00 to 11:59, afternoon 12:00 to
 * 16:59, evening 17:00 to 20:59, night otherwise.
 */
export function timeOfDay(hour) {
  if (hour >= 4 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/** Browser-local date, YYYY-MM-DD (used by useToday). */
export function localToday(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/**
 * Hourly records whose hour starts in [floorHour(from), from + hours).
 * `hourly` is sorted by time.
 */
export function sliceHours(hourly, from, hours) {
  const start = floorHour(from);
  const end = toMs(from) + hours * HOUR_MS;
  return (hourly || []).filter((h) => {
    const t = Date.parse(h.time);
    return t >= start && t < end;
  });
}

export { HOUR_MS };
