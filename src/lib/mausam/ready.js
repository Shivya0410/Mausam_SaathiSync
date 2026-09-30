// Be ready: preparedness habits, streaks, XP and badges (PRD 9.4, 18.15).
// Pure. Badges celebrate habits; they never imply safety.

import { addDays, daysBetween } from './time.js';

/** A = Aware, P = Prepared, S = Safe, H = Helper. */
export const PILLARS = ['A', 'P', 'S', 'H'];

/** XP caps kept from the SaathiSync policy (local preview, not tamper-proof). */
export const XP = Object.freeze({ perPillar: 10, allFourBonus: 10, maxPerDay: 50, maxPerWeek: 350 });

/**
 * The habit set shown for a date (i18n ready.pillars.<season>.<A|P|S|H>).
 * Preparedness seasons, not IMD's: fog and smog habits matter from December
 * to February, so December counts as winter here (IMD calls it
 * post-monsoon).
 */
export function readySeason(date) {
  const m = Number(String(date).slice(5, 7));
  if (m === 12 || m <= 2) return 'winter';
  if (m <= 5) return 'summer';
  if (m <= 9) return 'monsoon';
  return 'postMonsoon';
}

/** Seasonal kits (one-time checklists) and their items (i18n ready.kits.<kit>.items.<id>). */
export const KITS = {
  monsoon: ['torch', 'powerbank', 'medicines', 'documents', 'water', 'food', 'raincoat', 'numbers', 'drains', 'mainSwitch'],
  heat: ['bottle', 'ors', 'cap', 'cotton', 'curtains', 'fan', 'neighbour', 'workHours', 'petWater', 'firstAid'],
  winter: ['layers', 'mask', 'purifier', 'heaterSafety', 'fogLights', 'medicines', 'elderly', 'blanket', 'reflective', 'numbers'],
  cyclone: ['shelter', 'secure', 'water', 'food', 'medicines', 'powerbank', 'documents', 'radio', 'boats', 'numbers'],
};

/** Which kit fits a season (post-monsoon is cyclone season on the coasts). */
export const KIT_FOR_SEASON = { summer: 'heat', monsoon: 'monsoon', winter: 'winter', postMonsoon: 'cyclone' };

export const BADGES = [
  { id: 'first_check', icon: 'fa-solid fa-seedling' },
  { id: 'ready_day', icon: 'fa-solid fa-star' },
  { id: 'week_ready', icon: 'fa-solid fa-fire' },
  { id: 'monsoon_ready', icon: 'fa-solid fa-umbrella' },
  { id: 'heat_hero', icon: 'fa-solid fa-sun' },
  { id: 'lightning_smart', icon: 'fa-solid fa-bolt' },
  { id: 'sky_watcher', icon: 'fa-solid fa-cloud' },
  { id: 'citizen_reporter', icon: 'fa-solid fa-bullhorn' },
  { id: 'weather_wise', icon: 'fa-solid fa-brain' },
  { id: 'good_neighbour', icon: 'fa-solid fa-hands-holding' },
  { id: 'fog_safe', icon: 'fa-solid fa-smog' },
];

/** Default state for the `ready` store. */
export const READY_DEFAULT = Object.freeze({ log: {}, kits: {}, read: {}, quizzes: {}, badges: [] });

/** Toggle a habit on a date. Returns a new state. */
export function toggleHabit(state, date, pillar, on) {
  if (!PILLARS.includes(pillar)) return state;
  const day = state.log[date] || { p: [], season: readySeason(date) };
  const has = day.p.includes(pillar);
  const want = on ?? !has;
  if (want === has) return state;
  const p = want ? [...day.p, pillar].sort((a, b) => PILLARS.indexOf(a) - PILLARS.indexOf(b)) : day.p.filter((x) => x !== pillar);
  return { ...state, log: { ...state.log, [date]: { ...day, p } } };
}

export function xpForDay(pillars) {
  const n = new Set((pillars || []).filter((p) => PILLARS.includes(p))).size;
  return Math.min(n * XP.perPillar + (n === 4 ? XP.allFourBonus : 0), XP.maxPerDay);
}

/** Monday of the week containing a YYYY-MM-DD date. */
export function weekStart(date) {
  const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, -((dow + 6) % 7));
}

/** XP today, this week (capped) and all time (each week capped). */
export function xpTotals(log, today) {
  const byWeek = new Map();
  for (const [date, day] of Object.entries(log || {})) {
    const w = weekStart(date);
    byWeek.set(w, (byWeek.get(w) || 0) + xpForDay(day.p));
  }
  let total = 0;
  for (const v of byWeek.values()) total += Math.min(v, XP.maxPerWeek);
  return {
    today: xpForDay(log?.[today]?.p),
    week: Math.min(byWeek.get(weekStart(today)) || 0, XP.maxPerWeek),
    total,
  };
}

/**
 * Consecutive days with at least one habit, ending today (or yesterday, so
 * the streak does not look broken before today's first check).
 */
export function streak(log, today) {
  const active = (d) => (log?.[d]?.p?.length || 0) > 0;
  let d = active(today) ? today : addDays(today, -1);
  let n = 0;
  while (active(d)) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

export function longestStreak(log) {
  const dates = Object.keys(log || {}).filter((d) => log[d].p?.length).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of dates) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function kitDone(state, kit) {
  const ticked = new Set(state.kits?.[kit] || []);
  return KITS[kit].every((i) => ticked.has(i));
}

export function toggleKitItem(state, kit, item) {
  const cur = new Set(state.kits?.[kit] || []);
  if (cur.has(item)) cur.delete(item);
  else cur.add(item);
  return { ...state, kits: { ...state.kits, [kit]: KITS[kit].filter((i) => cur.has(i)) } };
}

/**
 * Badges earned from state (PRD 9.4 table). `extra` carries facts from
 * other stores: { skySnaps, myReports }.
 */
export function earnedBadges(state, extra = {}) {
  const days = Object.values(state.log || {});
  const count = (pillar, season) => days.filter((d) => d.p?.includes(pillar) && (!season || d.season === season)).length;
  const out = [];
  if (days.some((d) => d.p?.length)) out.push('first_check');
  if (days.some((d) => d.p?.length === 4)) out.push('ready_day');
  if (longestStreak(state.log) >= 7) out.push('week_ready');
  if (kitDone(state, 'monsoon')) out.push('monsoon_ready');
  if (count('S', 'summer') >= 10) out.push('heat_hero');
  if (state.read?.lightning && state.quizzes?.lightning?.passed) out.push('lightning_smart');
  if ((extra.skySnaps || 0) >= 5) out.push('sky_watcher');
  if ((extra.myReports || []).some((r) => r.status === 'community_verified' || r.status === 'ai_verified' || (r.confirmations || 0) >= 1)) out.push('citizen_reporter');
  if (state.quizzes?.myths?.done) out.push('weather_wise');
  if (count('H') >= 10) out.push('good_neighbour');
  if (state.read?.fog && count('S', 'winter') >= 5) out.push('fog_safe');
  return out;
}

/**
 * Award newly earned badges, idempotently (the SaathiSync record shape
 * { id, earnedAt } is kept). Returns { state, fresh }.
 */
export function awardBadges(state, earned, nowIso) {
  const owned = new Set((state.badges || []).map((b) => b.id));
  const fresh = earned.filter((id) => !owned.has(id) && BADGES.some((b) => b.id === id));
  if (!fresh.length) return { state, fresh };
  return { state: { ...state, badges: [...(state.badges || []), ...fresh.map((id) => ({ id, earnedAt: nowIso }))] }, fresh };
}

/** Last `n` days (oldest first) with how many habits were done. */
export function recentDays(log, today, n = 28) {
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, i - n + 1);
    return { date, count: log?.[date]?.p?.length || 0 };
  });
}

/** Mark an article read (for lightning_smart and fog_safe). */
export function markRead(state, slug, nowIso) {
  if (state.read?.[slug]) return state;
  return { ...state, read: { ...state.read, [slug]: nowIso } };
}

export function recordQuiz(state, id, result) {
  return { ...state, quizzes: { ...state.quizzes, [id]: result } };
}
