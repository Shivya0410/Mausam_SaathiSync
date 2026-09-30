// Display formatting (PRD section 12.6). Pure; no browser timezone is used:
// times are shown in the place's own timezone, read from the ISO offset.

/** Local hour and minute straight from an ISO string with offset. */
function hm(iso) {
  const m = /T(\d{2}):(\d{2})/.exec(iso || '');
  return m ? { h: Number(m[1]), m: Number(m[2]) } : null;
}

/** Hindi part of day for an hour (PRD 12.6: सुबह, दोपहर, शाम, रात). */
export function hiPeriod(h) {
  if (h >= 4 && h < 12) return 'सुबह';
  if (h >= 12 && h < 16) return 'दोपहर';
  if (h >= 16 && h < 20) return 'शाम';
  return 'रात';
}

/**
 * "4:30 PM" / "4 PM" in English; "शाम 4:30" / "शाम 4 बजे" in Hindi.
 * Accepts an ISO string with offset, or "HH:MM".
 */
export function fmtTime(value, lang = 'en') {
  const t = /^\d{1,2}:\d{2}$/.test(value || '') ? { h: Number(value.split(':')[0]), m: Number(value.split(':')[1]) } : hm(value);
  if (!t) return '';
  const h12 = t.h % 12 === 0 ? 12 : t.h % 12;
  const mm = String(t.m).padStart(2, '0');
  if (lang === 'hi') return t.m === 0 ? `${hiPeriod(t.h)} ${h12} बजे` : `${hiPeriod(t.h)} ${h12}:${mm}`;
  return `${h12}${t.m === 0 ? '' : `:${mm}`} ${t.h < 12 ? 'AM' : 'PM'}`;
}

/** Short hour label for strips: "3 PM" / "3 बजे". */
export function fmtHour(iso, lang = 'en') {
  const t = hm(iso);
  if (!t) return '';
  const h12 = t.h % 12 === 0 ? 12 : t.h % 12;
  return lang === 'hi' ? `${h12} बजे` : `${h12} ${t.h < 12 ? 'AM' : 'PM'}`;
}

const locale = (lang) => (lang === 'hi' ? 'hi-IN' : 'en-IN');

/** "Tue, 30 Sep" from a YYYY-MM-DD date (or ISO string). */
export function fmtDate(value, lang = 'en', { weekday = 'short', month = 'short', year } = {}) {
  const date = String(value || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return '';
  return new Intl.DateTimeFormat(locale(lang), {
    weekday: weekday || undefined,
    day: 'numeric',
    month,
    year,
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}

/** Weekday name for a date. */
export function fmtWeekday(value, lang = 'en', style = 'short') {
  const date = String(value || '').slice(0, 10);
  if (!date) return '';
  return new Intl.DateTimeFormat(locale(lang), { weekday: style, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

/** 'today' | 'tomorrow' | null relative to a local date. */
export function relativeDay(date, today) {
  if (!date || !today) return null;
  const d = Math.round((Date.parse(`${date.slice(0, 10)}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400e3);
  return d === 0 ? 'today' : d === 1 ? 'tomorrow' : d === -1 ? 'yesterday' : null;
}

export function fmtNumber(n, lang = 'en', opts = {}) {
  if (!Number.isFinite(n)) return '';
  // Latin digits in both languages for readability (PRD 12.6).
  return new Intl.NumberFormat(locale(lang), { numberingSystem: 'latn', ...opts }).format(n);
}

/** Visibility: metres below 1 km, else km (PRD 12.6). */
export function fmtVisibility(m, lang = 'en') {
  if (!Number.isFinite(m)) return '';
  if (m < 1000) return lang === 'hi' ? `${Math.round(m)} मीटर` : `${Math.round(m)} m`;
  const km = Math.round(m / 100) / 10;
  return lang === 'hi' ? `${fmtNumber(km, lang)} किमी` : `${fmtNumber(km, lang)} km`;
}

export function fmtDistance(m, lang = 'en') {
  return fmtVisibility(m, lang);
}

/** "12 min ago" / "2 h ago" from an age in ms. */
export function fmtAgo(ms, lang = 'en') {
  if (!Number.isFinite(ms) || ms < 0) return '';
  const min = Math.round(ms / 60000);
  if (min < 60) return lang === 'hi' ? `${min} मिनट` : `${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return lang === 'hi' ? `${h} घंटे` : `${h} h`;
  const d = Math.round(h / 24);
  return lang === 'hi' ? `${d} दिन` : `${d} days`;
}

const COMPASS_HI = { N: 'उत्तर', NE: 'उत्तर-पूर्व', E: 'पूर्व', SE: 'दक्षिण-पूर्व', S: 'दक्षिण', SW: 'दक्षिण-पश्चिम', W: 'पश्चिम', NW: 'उत्तर-पश्चिम' };
const COMPASS_EN = { N: 'north', NE: 'north-east', E: 'east', SE: 'south-east', S: 'south', SW: 'south-west', W: 'west', NW: 'north-west' };

/** Wind direction word (where the wind comes from). */
export function compassWord(code, lang = 'en', { long = false } = {}) {
  if (!code) return '';
  if (lang === 'hi') return COMPASS_HI[code] || code;
  return long ? COMPASS_EN[code] || code : code;
}

/** Temperature, rounded: "34°" or "34°C". */
export function fmtTemp(c, { unit = false } = {}) {
  if (!Number.isFinite(c)) return '–';
  return `${Math.round(c)}°${unit ? 'C' : ''}`;
}
