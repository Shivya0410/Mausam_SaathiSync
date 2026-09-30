// Slot extraction for Mausam Mitra (PRD 10.5). Pure.

import { normalise, joined } from './normalise.js';
import { CITIES } from '../../data/cities.js';
import { BEACHES } from '../../data/beaches.js';
import { AIRPORTS } from '../../data/airports.js';
import { LEXICON_WORDS } from './intents.js';

const TODAY = ['today', 'aaj', 'आज', 'now', 'abhi', 'अभी', 'tonight'];
const TOMORROW = ['tomorrow', 'kal', 'कल'];
const DAY_AFTER = ['parson', 'परसों'];
const WEEKDAYS = [
  ['sunday', 'ravivar', 'itwar', 'रविवार', 'इतवार'],
  ['monday', 'somvar', 'सोमवार'],
  ['tuesday', 'mangalvar', 'मंगलवार'],
  ['wednesday', 'budhvar', 'बुधवार'],
  ['thursday', 'guruvar', 'brihaspativar', 'गुरुवार', 'बृहस्पतिवार'],
  ['friday', 'shukravar', 'शुक्रवार'],
  ['saturday', 'shanivar', 'शनिवार'],
];
const PARTS = {
  morning: ['morning', 'subah', 'सुबह'],
  afternoon: ['afternoon', 'dopahar', 'दोपहर'],
  evening: ['evening', 'shaam', 'शाम'],
  night: ['night', 'tonight', 'raat', 'रात'],
};
export const PART_HOURS = { morning: [6, 10], afternoon: [12, 16], evening: [17, 20], night: [20, 24] };
const ACTIVITIES = {
  run: ['run', 'running', 'jog', 'jogging', 'daud', 'दौड', 'दौडने'],
  walk: ['walk', 'walking', 'sair', 'सैर', 'टहल', 'टहलने'],
  cycle: ['cycle', 'cycling', 'bike', 'साइकिल'],
  sports: ['cricket', 'football', 'sports', 'match', 'खेल', 'क्रिकेट'],
  yoga: ['yoga', 'योग'],
  trek: ['trek', 'trekking', 'hike', 'hiking'],
};
const PLACE_TYPES = {
  home: ['home', 'ghar', 'घर'],
  work: ['work', 'office', 'daftar', 'दफ्तर', 'ऑफिस'],
  school: ['school', 'स्कूल'],
  farm: ['farm', 'khet', 'खेत'],
  beach: ['beach'],
};

const norm = (w) => normalise(w).join(' ');
const hasAny = (set, j, list) => list.some((w) => {
  const n = norm(w);
  return n.includes(' ') ? j.includes(` ${n} `) : set.has(n);
});

/** Day offset, part of day, explicit hour and range (in days). */
export function extractWhen(tokens, todayDow = null) {
  const set = new Set(tokens);
  const j = joined(tokens);
  let day = null;
  let range = null;
  let assumed = false;
  if (j.includes(' day after tomorrow ') || hasAny(set, j, DAY_AFTER)) day = 2;
  else if (hasAny(set, j, TOMORROW)) {
    day = 1;
    // "kal" is tomorrow with future verbs; otherwise we assume and say so.
    const future = ['hogi', 'hoga', 'hoge', 'होगी', 'होगा', 'होंगे', 'will', 'tomorrow', 'jaun', 'sakte', 'karun'].some((w) => set.has(norm(w)));
    if (!future && !set.has('tomorrow')) assumed = true;
  } else if (hasAny(set, j, TODAY)) day = 0;
  if (day == null && todayDow != null) {
    const i = WEEKDAYS.findIndex((names) => hasAny(set, j, names));
    if (i >= 0) day = (i - todayDow + 7) % 7 || 7;
  }
  if (j.includes(' next week ') || j.includes(' agle hafte ') || j.includes(` ${norm('अगले हफ्ते')} `)) {
    day = day ?? 1;
    range = 7;
  } else if (j.includes(' this week ') || j.includes(' is hafte ') || j.includes(` ${norm('इस हफ्ते')} `)) {
    day = day ?? 0;
    range = 7;
  }
  let part = null;
  for (const [k, list] of Object.entries(PARTS)) if (hasAny(set, j, list)) part = part || k;
  if (set.has('tonight')) part = 'night';

  // Explicit hour: "7 am", "7pm", "7 baje", "7 बजे", "19:30".
  let hour = null;
  const m = j.match(/\s(\d{1,2})(?::(\d{2}))?\s?(am|pm|baje|बजे)?\s/);
  if (m && (m[2] || m[3])) {
    let h = Number(m[1]);
    if (m[3] === 'pm' && h < 12) h += 12;
    if (m[3] === 'am' && h === 12) h = 0;
    if ((m[3] === 'baje' || m[3] === 'बजे') && h < 12 && (part === 'afternoon' || part === 'evening' || part === 'night')) h += 12;
    if (h >= 0 && h < 24) hour = h;
  }
  return { day, part, hour, range, assumed };
}

export function extractActivity(tokens) {
  const set = new Set(tokens);
  const j = joined(tokens);
  for (const [k, list] of Object.entries(ACTIVITIES)) if (hasAny(set, j, list)) return k;
  return null;
}

// Words that are never place names (question words, time words, lexicon).
const STOP = new Set(
  [
    'the', 'a', 'my', 'today', 'tomorrow', 'now', 'there', 'here', 'it', 'this', 'that', 'week', 'morning', 'evening',
    'night', 'afternoon', 'aaj', 'kal', 'abhi', 'mausam', 'weather', 'barish', 'rain', 'kya', 'hai', 'hogi', 'kaisa',
    'कल', 'आज', 'मौसम', 'बारिश', 'क्या', 'है', 'होगी', 'कैसा', 'अभी', 'next', 'agle', 'hafte', 'subah', 'shaam', 'raat',
    'home', 'ghar', 'office', 'work', 'school', 'farm', 'khet', 'crops', 'kids', 'me', 'us', 'you', 'our', 'your', 'going',
  ].map(norm),
);
const isStop = (w) => STOP.has(w) || LEXICON_WORDS.has(w);

/**
 * Place reference, in order: saved place type ("ghar", "office"), saved
 * place name, bundled city/beach/airport name, then an unknown name after
 * "in"/"at"/"for" or before "mein"/"में"/"ka" to geocode.
 * @returns {{ kind: 'saved'|'city'|'beach'|'airport'|'query'|null, place?, query? }}
 */
export function extractPlace(tokens, { places = [] } = {}) {
  const set = new Set(tokens);
  const j = joined(tokens);
  for (const [type, list] of Object.entries(PLACE_TYPES)) {
    if (hasAny(set, j, list)) {
      const p = places.find((x) => x.type === type);
      if (p) return { kind: 'saved', place: p };
    }
  }
  for (const p of places) {
    if (p.name && j.includes(` ${norm(p.name)} `)) return { kind: 'saved', place: p };
  }
  for (const b of BEACHES) if (j.includes(` ${norm(b.name)} `)) return { kind: 'beach', place: { id: `beach-${b.id}`, name: b.name, lat: b.lat, lon: b.lon, state: b.state, isCoastal: true, beach: b } };
  for (const c of CITIES) {
    if (j.includes(` ${norm(c.name)} `) || (c.nameHi && j.includes(` ${norm(c.nameHi)} `))) return { kind: 'city', place: { ...c, id: `city-${c.id}` } };
  }
  const aliases = { bangalore: 'bengaluru', bombay: 'mumbai', calcutta: 'kolkata', madras: 'chennai', dilli: 'delhi', lakhnau: 'lucknow' };
  for (const [alias, id] of Object.entries(aliases)) {
    if (set.has(alias)) {
      const c = CITIES.find((x) => x.id === id);
      return { kind: 'city', place: { ...c, id: `city-${c.id}` } };
    }
  }
  const m = j.match(/\s(?:in|at|for)\s([^\s]+(?:\s[^\s]+)?)\s/) || j.match(/\s([^\s]+)\s(?:mein|में|ka|ki|ke|का|की|के)\s/);
  if (m) {
    const words = m[1].split(' ').filter((w) => !isStop(w) && !/^\d/.test(w));
    if (words.length && words[0].length >= 3) return { kind: 'query', query: words.join(' ') };
  }
  return { kind: null };
}

/** Airport from the place or a named airport city. */
export function airportFor(place, tokens) {
  const j = joined(tokens);
  const named = AIRPORTS.find((a) => j.includes(` ${norm(a.city)} `) || j.includes(` ${a.iata.toLowerCase()} `));
  if (named) return named;
  if (!place) return null;
  let best = null;
  for (const a of AIRPORTS) {
    const d = Math.hypot(a.lat - place.lat, a.lon - place.lon);
    if (d < 0.6 && (!best || d < best.d)) best = { a, d };
  }
  return best ? best.a : null;
}

export function extractSlots(text, opts = {}) {
  const tokens = normalise(text);
  return {
    tokens,
    when: extractWhen(tokens, opts.todayDow ?? null),
    activity: extractActivity(tokens),
    placeRef: extractPlace(tokens, opts),
  };
}
