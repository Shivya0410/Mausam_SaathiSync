// Store definitions (PRD section 13.6) and pure update helpers.
// Personal stores are scoped per signed-in identity; device preferences
// (accessibility, notifications, demo) belong to the phone, not a person.

import { createStore } from './deviceStore.js';
import { MAX_PERSONAS, PERSONA_IDS } from '../../config/personas.js';

export const stores = {
  onboarding: createStore('mausam.onboarding.v1', { completedAt: null, version: 1 }, { scoped: false }),
  places: createStore('mausam.places.v1', []),
  currentPlace: createStore('mausam.currentPlace.v1', { id: null }),
  personas: createStore('mausam.personas.v1', { primary: null, secondary: [] }),
  personaSettings: createStore('mausam.personaSettings.v1', {
    commute: { times: [], mode: 'two_wheeler', travelMin: 45, homeId: null, workId: null },
    family: { schoolTimes: { morning: null, afternoon: null }, schoolId: null, children: null, weekendReminders: false },
    fitness: { activity: 'run', band: 'early_morning', durationMin: 60, feel: 'prefer_cool' },
    work: { hours: ['09:00', '19:00'], type: 'delivery', city: null },
    farm: { role: 'farmer', crops: [], irrigation: null, farmId: null },
    coast: { beachIds: [], currentBeachId: null, activity: 'swim' },
    health: { reminderTime: null },
  }),
  sensitivities: createStore('mausam.sensitivities.v1', { list: [], consentAt: null }),
  household: createStore('mausam.household.v1', { members: [], selected: 'me' }),
  layout: createStore('mausam.layout.v1', { pinned: [], hidden: [], order: [] }),
  usage: createStore('mausam.usage.v1', { firstSeen: null, widgetTaps: {}, pageVisits: {}, nudgesOff: false, nudged: {} }),
  cardState: createStore('mausam.cardState.v1', {}),
  trips: createStore('mausam.trips.v1', []),
  events: createStore('mausam.events.v1', []),
  packing: createStore('mausam.packing.v1', {}),
  a11y: createStore(
    'mausam.a11y.v1',
    { textScale: 100, contrast: false, simple: false, reduceMotion: false, lite: null, speechRate: 1 },
    { scoped: false },
  ),
  notify: createStore(
    'mausam.notify.v1',
    {
      official: true,
      yellow: false,
      rainHour: null, // null: on for commute, family, work, farm (PRD 7.4)
      lightning: null, // null: on for outdoor personas
      morning: false,
      morningTime: '07:00',
      reports: false,
      quietFrom: '22:00',
      quietTo: '06:00',
      seen: [],
      sentToday: { date: null, count: 0 },
    },
    { scoped: false },
  ),
  demo: createStore('mausam.demo.v1', { scenario: null }, { scoped: false }),
  // A random id for this browser, used only for report rate limits and
  // one-vote-per-report; the server stores it as a salted hash.
  device: createStore('mausam.device.v1', { clientId: null }, { scoped: false }),
  myReports: createStore('mausam.myReports.v1', [], { scoped: false }),
  reportVotes: createStore('mausam.reportVotes.v1', {}, { scoped: false }),
  // Counts for Be ready badges (sky_watcher after 5 snaps, PRD 11.1).
  cvStats: createStore('mausam.cvStats.v1', { skySnaps: 0, waterReports: 0, fogChecks: 0 }),
};

// ── Personas ──

/** [{ id, role }] with the primary first; 'citizen' when nothing is chosen. */
export function personaList(state) {
  const out = [];
  if (state?.primary && PERSONA_IDS.includes(state.primary)) out.push({ id: state.primary, role: 'primary' });
  for (const id of state?.secondary || []) {
    if (PERSONA_IDS.includes(id) && !out.some((p) => p.id === id)) out.push({ id, role: 'secondary' });
  }
  return out.length ? out.slice(0, MAX_PERSONAS) : [{ id: 'citizen', role: 'primary' }];
}

/** Persona ids from a list of choices, primary first (max 3). */
export function personasFromChoices(ids) {
  const clean = [...new Set(ids.filter((id) => PERSONA_IDS.includes(id) && id !== 'citizen'))].slice(0, MAX_PERSONAS);
  return { primary: clean[0] || null, secondary: clean.slice(1) };
}

/** Toggle a persona in an ordered choice list, keeping at most 3. */
export function toggleChoice(list, id, max = MAX_PERSONAS) {
  if (list.includes(id)) return list.filter((x) => x !== id);
  return list.length >= max ? list : [...list, id];
}

// ── Places ──

export const DEFAULT_PLACE = Object.freeze({
  id: 'default-delhi',
  name: 'Delhi',
  nameHi: 'दिल्ली',
  lat: 28.61,
  lon: 77.21,
  state: 'Delhi',
  district: 'New Delhi',
  countryCode: 'IN',
  type: 'other',
  isDefault: true,
});

export const PLACE_TYPES = ['home', 'work', 'school', 'farm', 'beach', 'other'];
export const MAX_PLACES = 20;

let idCounter = 0;
export function newId(prefix = 'p') {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

/** Normalise a search result, quick pick or GPS fix into a Place. */
export function toPlace(src, { type = 'other', id } = {}) {
  return {
    id: id || src.id || newId(),
    name: src.name,
    nameHi: src.nameHi || null,
    lat: Math.round(src.lat * 10000) / 10000,
    lon: Math.round(src.lon * 10000) / 10000,
    state: src.state ?? src.admin1 ?? null,
    district: src.district ?? src.admin2 ?? null,
    countryCode: src.countryCode ?? 'IN',
    featureCode: src.featureCode ?? null,
    type: PLACE_TYPES.includes(type) ? type : 'other',
  };
}

/** Add or replace a place (same id, or same type for home/work/school/farm). */
export function upsertPlace(list, place) {
  const uniqueType = ['home', 'work', 'school', 'farm'].includes(place.type);
  const rest = list.filter((p) => p.id !== place.id && !(uniqueType && p.type === place.type));
  return [place, ...rest].slice(0, MAX_PLACES);
}

export function removePlace(list, id) {
  return list.filter((p) => p.id !== id);
}

export function movePlace(list, id, delta) {
  const i = list.findIndex((p) => p.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const copy = list.slice();
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

/** The current place: the chosen one, else the first saved, else Delhi. */
export function resolveCurrentPlace(list, currentId) {
  return list.find((p) => p.id === currentId) || list[0] || DEFAULT_PLACE;
}

export function placeOfType(list, type) {
  return list.find((p) => p.type === type) || null;
}

// ── Homepage layout (PRD 3.5 layer 5, 9.5 section 4) ──

export function togglePin(layout, id) {
  const pinned = layout.pinned.includes(id) ? layout.pinned.filter((x) => x !== id) : [...layout.pinned, id];
  return { ...layout, pinned, hidden: layout.hidden.filter((x) => x !== id) };
}

export function toggleHide(layout, id) {
  const hidden = layout.hidden.includes(id) ? layout.hidden.filter((x) => x !== id) : [...layout.hidden, id];
  return { ...layout, hidden, pinned: layout.pinned.filter((x) => x !== id) };
}

/**
 * Move a widget up or down within the current visible order. Pinned widgets
 * move within the pinned list; others are recorded in `order`.
 */
export function moveWidget(layout, visibleIds, id, delta) {
  if (layout.pinned.includes(id)) {
    const i = layout.pinned.indexOf(id);
    const j = i + delta;
    if (j < 0 || j >= layout.pinned.length) return layout;
    const pinned = layout.pinned.slice();
    [pinned[i], pinned[j]] = [pinned[j], pinned[i]];
    return { ...layout, pinned };
  }
  const unpinned = visibleIds.filter((x) => !layout.pinned.includes(x));
  const i = unpinned.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= unpinned.length) return layout;
  const order = unpinned.slice();
  [order[i], order[j]] = [order[j], order[i]];
  return { ...layout, order };
}

export function resetLayout() {
  return { pinned: [], hidden: [], order: [] };
}

// ── Card state: dismissals and feedback, per local date ──

/** Dismissed rule ids for a date and place, as a Set. */
export function dismissedFor(cardState, date, placeId) {
  return new Set(cardState?.[date]?.dismissed?.[placeId] || []);
}

export function dismissCard(cardState, date, placeId, ruleId) {
  const day = cardState[date] || { dismissed: {}, feedback: {} };
  const list = day.dismissed?.[placeId] || [];
  const next = {
    ...pruneDays(cardState, date),
    [date]: { ...day, dismissed: { ...day.dismissed, [placeId]: [...new Set([...list, ruleId])] } },
  };
  return next;
}

export function recordFeedback(cardState, date, cardId, helpful) {
  const day = cardState[date] || { dismissed: {}, feedback: {} };
  return { ...pruneDays(cardState, date), [date]: { ...day, feedback: { ...day.feedback, [cardId]: helpful } } };
}

/** Keep only the last 7 days of card state. */
function pruneDays(cardState, today) {
  const keep = {};
  for (const [d, v] of Object.entries(cardState || {})) {
    if (d <= today && Date.parse(today) - Date.parse(d) <= 7 * 86400e3) keep[d] = v;
  }
  return keep;
}

// ── Usage and nudges (PRD 3.5 layer 4) ──

export function recordPageVisit(usage, page, now = Date.now()) {
  return {
    ...usage,
    firstSeen: usage.firstSeen || new Date(now).toISOString(),
    pageVisits: { ...usage.pageVisits, [page]: (usage.pageVisits?.[page] || 0) + 1 },
  };
}

export function recordWidgetTap(usage, widgetId) {
  return { ...usage, widgetTaps: { ...usage.widgetTaps, [widgetId]: (usage.widgetTaps?.[widgetId] || 0) + 1 } };
}

/**
 * One-time nudge: after 7 days, suggest a persona whose page the user
 * visited 3 or more times without choosing it. Returns a persona id or null.
 */
export function nudgeFor(usage, chosenIds, now = Date.now()) {
  if (!usage || usage.nudgesOff || !usage.firstSeen) return null;
  if (now - Date.parse(usage.firstSeen) < 7 * 86400e3) return null;
  const candidates = Object.entries(usage.pageVisits || {})
    .filter(([id, n]) => n >= 3 && PERSONA_IDS.includes(id) && !chosenIds.includes(id) && !usage.nudged?.[id])
    .sort((a, b) => b[1] - a[1]);
  return candidates[0]?.[0] ?? null;
}

// ── Household (PRD 3.6) ──

export const MAX_MEMBERS = 5; // plus the phone's owner: 6 people

export function addMember(household, member) {
  if (household.members.length >= MAX_MEMBERS) return household;
  const name = String(member.name || '').trim().slice(0, 20);
  if (!name) return household;
  return { ...household, members: [...household.members, { ...member, name, id: member.id || newId('m') }] };
}

export function updateMember(household, id, patch) {
  return {
    ...household,
    members: household.members.map((m) => (m.id === id ? { ...m, ...patch, name: String(patch.name ?? m.name).trim().slice(0, 20) } : m)),
  };
}

export function removeMember(household, id) {
  return {
    ...household,
    members: household.members.filter((m) => m.id !== id),
    selected: household.selected === id ? 'everyone' : household.selected,
  };
}

// ── Trips and events ──

export function upsertById(list, item) {
  const rest = list.filter((x) => x.id !== item.id);
  return [...rest, item].sort((a, b) => String(a.from ?? a.date ?? '').localeCompare(String(b.from ?? b.date ?? '')));
}

export function removeById(list, id) {
  return list.filter((x) => x.id !== id);
}
