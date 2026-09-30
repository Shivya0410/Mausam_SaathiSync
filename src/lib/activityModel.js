/**
 * Shared qualifying-activity model for the Profile dashboard.
 *
 * VERIFIED SOURCE (see src/components/calendar/Calendar.js:7-12,
 * src/views/trackersheet/Tracker.js):
 *   Y = Yoga (pillars.yoga)
 *   M = Meditation (pillars.meditation)
 *   E = Healthy Diet (pillars.diet, stored under code "E")
 *   C = Creative Hub (pillars.creative)
 *
 * A qualifying activity is a CHECKED tracker checkbox (value === true) for one
 * of those four pillars on a real calendar date. Page visits, logins, route
 * visits, inbox reads, and notification views are NEVER qualifying.
 *
 * Explicitly excluded: cycle/menstrual data, medical complications, body
 * measurements, and any health-risk content. Those must never feed streaks,
 * XP, insights, or rankings.
 *
 * Tracker storage shape (per user, via userScopedStorage under
 * "swasth.tracker.v1::<identity>"):
 *   { "2026-9": { "14": { Y: true, M: true } } }
 * Month ids use `${year}-${month}` with month 1-12 (not zero-padded).
 */

// Pillar codes as stored by the Tracker. E means diet (historical code).
export const PILLAR_CODES = ["Y", "M", "E", "C"];

export const PILLAR_META = {
  Y: { category: "yoga", labelKey: "pillars.yoga" },
  M: { category: "fitness", labelKey: "pillars.meditation" },
  E: { category: "nutrition", labelKey: "pillars.diet" },
  // Creative-hub participation counts locally as community/sustainability
  // engagement. It is NOT a carbon saving and never presented as one.
  C: { category: "sustainability", labelKey: "pillars.creative" },
};

export const LEADERBOARD_CATEGORIES = [
  "overall",
  "yoga",
  "fitness",
  "nutrition",
  "sustainability",
];

// Which pillars feed each leaderboard category in the LOCAL model.
export const CATEGORY_PILLARS = {
  overall: ["Y", "M", "E", "C"],
  yoga: ["Y"],
  fitness: ["Y", "M"],
  nutrition: ["E"],
  sustainability: ["C"],
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isRealCalendarDate(s) {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const [ys, ms, ds] = s.split("-").map(Number);
  if (ms < 1 || ms > 12 || ds < 1 || ds > 31) return false;
  const d = new Date(Date.UTC(ys, ms - 1, ds));
  return (
    d.getUTCFullYear() === ys &&
    d.getUTCMonth() === ms - 1 &&
    d.getUTCDate() === ds
  );
}

export function toISODate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!y || !m || !d) return null;
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  const s = `${y}-${mm}-${dd}`;
  return isRealCalendarDate(s) ? s : null;
}

export function localTodayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function padMonthId(monthId) {
  // Tracker month ids look like "2026-9"; normalise for parsing only.
  const m = String(monthId || "").match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
}

/**
 * Flatten one user's tracker store into qualifying events.
 * @param {object} allMonths e.g. { "2026-9": { "14": { Y: true } } }
 * @param {string|null} todayISO events after this date are dropped (anti-farming)
 * @returns {Array<{date:string,pillar:string}>} sorted ascending by date
 */
export function trackerStoreToEvents(allMonths, todayISO = null) {
  if (!allMonths || typeof allMonths !== "object") return [];
  const out = [];
  for (const [monthId, days] of Object.entries(allMonths)) {
    const parsed = padMonthId(monthId);
    if (!parsed || !days || typeof days !== "object") continue;
    const { year, month } = parsed;
    if (month < 1 || month > 12) continue;
    for (const [dayStr, checks] of Object.entries(days)) {
      const day = Number(dayStr);
      if (!Number.isInteger(day) || day < 1 || day > 31) continue;
      if (!checks || typeof checks !== "object") continue;
      const iso = toISODate(year, month, day);
      if (!iso) continue;
      if (todayISO && iso > todayISO) continue; // no future logging
      for (const code of PILLAR_CODES) {
        if (checks[code] === true) out.push({ date: iso, pillar: code });
      }
    }
  }
  out.sort((a, b) =>
    a.date === b.date ? a.pillar.localeCompare(b.pillar) : a.date < b.date ? -1 : 1
  );
  return out;
}

export function aggregateByDay(events) {
  const map = new Map(); // date -> { count, pillars:Set }
  for (const e of events || []) {
    if (!e || !isRealCalendarDate(e.date)) continue;
    if (!PILLAR_CODES.includes(e.pillar)) continue;
    let cell = map.get(e.date);
    if (!cell) {
      cell = { count: 0, pillars: new Set() };
      map.set(e.date, cell);
    }
    if (!cell.pillars.has(e.pillar)) {
      cell.pillars.add(e.pillar);
      cell.count = cell.pillars.size;
    }
  }
  return map;
}

/** Consecutive-day run ending at the latest date (YYYY-MM-DD strings). */
export function streakEndingAtLatest(dates) {
  if (!dates || dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let streak = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const a = new Date(`${sorted[i]}T12:00:00Z`);
    const b = new Date(`${sorted[i - 1]}T12:00:00Z`);
    if ((a - b) / 86400000 === 1) streak += 1;
    else break;
  }
  return streak;
}

export function longestStreak(dates) {
  if (!dates || dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(`${sorted[i]}T12:00:00Z`);
    const b = new Date(`${sorted[i - 1]}T12:00:00Z`);
    if ((a - b) / 86400000 === 1) run += 1;
    else {
      best = Math.max(best, run);
      run = 1;
    }
  }
  return Math.max(best, run);
}

/**
 * Summarise qualifying events. Pure + deterministic; safe for tests/SSR.
 */
export function summarizeEvents(events) {
  const byDay = aggregateByDay(events);
  const dates = [...byDay.keys()].sort();
  const perPillar = { Y: 0, M: 0, E: 0, C: 0 };
  let perfectDays = 0;
  let bestDay = null;
  let bestScore = -1;
  for (const [date, cell] of byDay) {
    for (const p of cell.pillars) perPillar[p] += 1;
    if (cell.count === 4) perfectDays += 1;
    if (cell.count > bestScore) {
      bestScore = cell.count;
      bestDay = date;
    }
  }
  const totalChecks = (events || []).length;
  return {
    activeDays: byDay.size,
    perfectDays,
    totalChecks,
    perPillar,
    bestDay,
    bestScore: bestDay ? bestScore : 0,
    currentStreak: streakEndingAtLatest(dates),
    longestStreak: longestStreak(dates),
    firstDate: dates[0] || null,
    lastDate: dates[dates.length - 1] || null,
  };
}

/** Monday (YYYY-MM-DD) of the week containing `iso`. */
export function weekStartMonday(iso) {
  if (!isRealCalendarDate(iso)) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = (dt.getDay() + 6) % 7; // Mon=0
  dt.setDate(dt.getDate() - dow);
  return localTodayISO(dt);
}

export function isDateInWeek(dateISO, weekStartISO) {
  if (!isRealCalendarDate(dateISO) || !isRealCalendarDate(weekStartISO)) return false;
  const [y1, m1, d1] = dateISO.split("-").map(Number);
  const [y2, m2, d2] = weekStartISO.split("-").map(Number);
  const t = new Date(y1, m1 - 1, d1).getTime();
  const s = new Date(y2, m2 - 1, d2).getTime();
  return t >= s && t < s + 7 * 86400000;
}
