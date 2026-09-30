// Device stores, formatting, card text and the personal view (Part 2
// foundation). Pure modules only; React hooks are exercised in the browser.

import test from 'node:test';
import assert from 'node:assert/strict';

import { createStore, readKey, writeKey, listMausamKeys, clearKeys, __clearStoreCache } from '../src/lib/stores/deviceStore.js';
import {
  personaList, personasFromChoices, toggleChoice, toPlace, upsertPlace, removePlace, movePlace, resolveCurrentPlace,
  DEFAULT_PLACE, togglePin, toggleHide, moveWidget, resetLayout, dismissedFor, dismissCard, recordFeedback,
  recordPageVisit, nudgeFor, addMember, updateMember, removeMember, MAX_MEMBERS, upsertById,
} from '../src/lib/stores/index.js';
import { fmtTime, fmtHour, fmtDate, relativeDay, fmtVisibility, fmtAgo, compassWord, hiPeriod, fmtTemp } from '../src/lib/format.js';
import { cardText, fmtWhen, cardSpeech } from '../src/lib/mausam/cardText.js';
import { personalView, ruleSettings } from '../src/lib/mausam/personal.js';
import { buildScenario } from '../src/data/fixtures/scenarios.js';
import { at, DATE, snapshot, warning, hours } from './helpers/weather.mjs';

function installStorage() {
  const prev = { window: globalThis.window, localStorage: globalThis.localStorage };
  const map = new Map();
  const listeners = new Map();
  const ls = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
  globalThis.localStorage = ls;
  globalThis.window = {
    localStorage: ls,
    addEventListener: (t, cb) => (listeners.get(t) || listeners.set(t, new Set()).get(t)).add(cb),
    removeEventListener: (t, cb) => listeners.get(t)?.delete(cb),
    dispatchEvent: (e) => {
      for (const cb of listeners.get(e.type) ?? []) cb(e);
      return true;
    },
  };
  return {
    map,
    restore() {
      __clearStoreCache();
      for (const [k, v] of Object.entries(prev)) {
        if (v === undefined) delete globalThis[k];
        else globalThis[k] = v;
      }
    },
  };
}

// ── deviceStore ──
test('device store: defaults, stable snapshots, merge of new fields, per-user keys', () => {
  const env = installStorage();
  try {
    const s = createStore('mausam.test.v1', { a: 1, b: [] });
    assert.equal(s.read(null), s.defaults, 'missing key returns the frozen defaults');
    assert.ok(Object.isFrozen(s.defaults));
    s.write(null, { a: 2 });
    const first = s.read(null);
    assert.deepEqual(first, { a: 2, b: [] }, 'new default fields are merged in');
    assert.equal(s.read(null), first, 'snapshot is referentially stable while storage is unchanged');
    s.write(null, (prev) => ({ ...prev, a: 3 }));
    assert.equal(s.read(null).a, 3);
    s.write({ _id: 'u1' }, { a: 9 });
    assert.equal(s.read({ _id: 'u1' }).a, 9);
    assert.equal(s.read(null).a, 3, 'guest and account data stay separate');
    env.map.set('mausam.test.v1::guest', '{broken');
    assert.equal(s.read(null), s.defaults, 'corrupt data falls back to defaults');
    const device = createStore('mausam.device.v1', { x: 0 }, { scoped: false });
    device.write(null, { x: 1 });
    assert.ok(env.map.has('mausam.device.v1'));
    assert.deepEqual(listMausamKeys(), ['mausam.device.v1', 'mausam.test.v1::guest', 'mausam.test.v1::id:u1']);
    env.map.set('swasth.tracker.v1', '{}');
    assert.equal(clearKeys('swasth.'), 1);
    assert.equal(readKey('nope', 'fb'), 'fb');
    writeKey('mausam.arr.v1', [1, 2]);
    assert.deepEqual(readKey('mausam.arr.v1', []), [1, 2]);
  } finally {
    env.restore();
  }
});

test('device store works when storage is missing (private mode, E19)', () => {
  const s = createStore('mausam.none.v1', { a: 1 });
  assert.equal(s.read(null), s.defaults);
  assert.doesNotThrow(() => s.write(null, { a: 2 }));
});

// ── personas ──
test('personas: primary first, max three, citizen by default', () => {
  assert.deepEqual(personaList({ primary: null, secondary: [] }), [{ id: 'citizen', role: 'primary' }]);
  assert.deepEqual(personaList({ primary: 'commute', secondary: ['health', 'bogus', 'health'] }), [
    { id: 'commute', role: 'primary' },
    { id: 'health', role: 'secondary' },
  ]);
  assert.deepEqual(personasFromChoices(['farm', 'citizen', 'work', 'health', 'coast']), { primary: 'farm', secondary: ['work', 'health'] });
  assert.deepEqual(toggleChoice(['a', 'b', 'c'], 'd'), ['a', 'b', 'c'], 'a fourth pick is refused');
  assert.deepEqual(toggleChoice(['a', 'b'], 'a'), ['b']);
});

// ── places ──
test('places: normalise, one home/work/school/farm each, reorder, fallback to Delhi', () => {
  const lko = toPlace({ id: 'x', name: 'Lucknow', lat: 26.8467123, lon: 80.9461789, admin1: 'Uttar Pradesh', admin2: 'Lucknow' }, { type: 'home' });
  assert.deepEqual([lko.lat, lko.lon, lko.state, lko.district, lko.type], [26.8467, 80.9462, 'Uttar Pradesh', 'Lucknow', 'home']);
  let list = upsertPlace([], lko);
  list = upsertPlace(list, toPlace({ id: 'y', name: 'Kanpur', lat: 26.4, lon: 80.3 }, { type: 'home' }));
  assert.deepEqual(list.map((p) => p.id), ['y'], 'a new home replaces the old one');
  list = upsertPlace(list, toPlace({ id: 'w', name: 'Office', lat: 26.9, lon: 80.9 }, { type: 'work' }));
  assert.deepEqual(movePlace(list, 'y', 1).map((p) => p.id), ['w', 'y']);
  assert.deepEqual(movePlace(list, 'w', 5), list);
  assert.deepEqual(removePlace(list, 'w').map((p) => p.id), ['y']);
  assert.equal(resolveCurrentPlace([], null), DEFAULT_PLACE);
  assert.equal(resolveCurrentPlace(list, 'y').name, 'Kanpur');
  assert.equal(resolveCurrentPlace(list, 'gone').id, list[0].id);
});

// ── layout ──
test('layout: pin, hide, move and reset', () => {
  let l = resetLayout();
  l = togglePin(l, 'aqi');
  assert.deepEqual(l.pinned, ['aqi']);
  l = toggleHide(l, 'aqi');
  assert.deepEqual([l.pinned, l.hidden], [[], ['aqi']], 'hiding unpins');
  l = togglePin(l, 'aqi');
  assert.deepEqual([l.pinned, l.hidden], [['aqi'], []], 'pinning unhides');
  l = togglePin(l, 'uv');
  assert.deepEqual(moveWidget(l, ['aqi', 'uv', 'hourly'], 'uv', -1).pinned, ['uv', 'aqi']);
  const moved = moveWidget(l, ['aqi', 'uv', 'hourly', 'daily'], 'daily', -1);
  assert.deepEqual(moved.order, ['daily', 'hourly']);
  assert.equal(moveWidget(l, ['aqi', 'uv', 'hourly'], 'hourly', 1), l, 'cannot move past the end');
});

// ── card state ──
test('card state: dismissals per date and place; old days pruned', () => {
  let s = dismissCard({}, DATE, 'home', 'general.umbrella');
  s = dismissCard(s, DATE, 'home', 'general.umbrella');
  assert.deepEqual([...dismissedFor(s, DATE, 'home')], ['general.umbrella']);
  assert.equal(dismissedFor(s, DATE, 'work').size, 0);
  assert.equal(dismissedFor(s, '2026-09-30', 'home').size, 0, 'tomorrow the card can come back');
  s = recordFeedback(s, DATE, 'c1', true);
  assert.equal(s[DATE].feedback.c1, true);
  const later = dismissCard(s, '2026-10-15', 'home', 'x');
  assert.deepEqual(Object.keys(later), ['2026-10-15']);
});

// ── nudges ──
test('nudge after 7 days for a persona page visited 3+ times', () => {
  const t0 = Date.parse('2026-09-01T00:00:00Z');
  let u = { firstSeen: null, pageVisits: {}, widgetTaps: {}, nudged: {} };
  for (let i = 0; i < 3; i++) u = recordPageVisit(u, 'farm', t0);
  assert.equal(nudgeFor(u, ['commute'], t0 + 86400e3), null, 'not before 7 days');
  assert.equal(nudgeFor(u, ['commute'], t0 + 8 * 86400e3), 'farm');
  assert.equal(nudgeFor(u, ['farm'], t0 + 8 * 86400e3), null, 'already chosen');
  assert.equal(nudgeFor({ ...u, nudgesOff: true }, [], t0 + 8 * 86400e3), null);
  assert.equal(nudgeFor({ ...u, nudged: { farm: true } }, [], t0 + 8 * 86400e3), null, 'one time only');
});

// ── household ──
test('household: names trimmed to 20, at most 5 extra members', () => {
  let h = { members: [], selected: 'me' };
  h = addMember(h, { name: '  Dadi  ', personas: ['health'], lang: 'hi' });
  assert.equal(h.members[0].name, 'Dadi');
  assert.equal(addMember(h, { name: '   ' }), h, 'empty names are refused');
  for (let i = 0; i < 10; i++) h = addMember(h, { name: `M${i}` });
  assert.equal(h.members.length, MAX_MEMBERS);
  const id = h.members[0].id;
  h = updateMember(h, id, { name: 'A very long nickname indeed' });
  assert.equal(h.members[0].name.length, 20);
  h = { ...h, selected: id };
  h = removeMember(h, id);
  assert.equal(h.selected, 'everyone');
  assert.deepEqual(upsertById([{ id: 'b', from: '2026-10-05' }], { id: 'a', from: '2026-10-01' }).map((x) => x.id), ['a', 'b']);
});

// ── format ──
test('time formatting uses the place clock, in English and Hindi', () => {
  assert.equal(fmtTime('2026-09-29T16:30:00+05:30', 'en'), '4:30 PM');
  assert.equal(fmtTime('2026-09-29T16:00:00+05:30', 'en'), '4 PM');
  assert.equal(fmtTime('2026-09-29T00:15:00+05:30', 'en'), '12:15 AM');
  assert.equal(fmtTime('2026-09-29T16:00:00+05:30', 'hi'), 'शाम 4 बजे');
  assert.equal(fmtTime('2026-09-29T07:15:00+05:30', 'hi'), 'सुबह 7:15');
  assert.equal(fmtTime('08:30', 'en'), '8:30 AM');
  assert.equal(fmtTime('2026-09-29T10:00:00+01:00', 'en'), '10 AM', 'a London time stays London time (E6)');
  assert.deepEqual([4, 12, 16, 21, 2].map(hiPeriod), ['सुबह', 'दोपहर', 'शाम', 'रात', 'रात']);
  assert.equal(fmtHour('2026-09-29T15:00:00+05:30', 'en'), '3 PM');
  assert.equal(fmtDate('2026-09-29', 'en'), 'Tue, 29 Sept');
  assert.equal(relativeDay('2026-09-30', '2026-09-29'), 'tomorrow');
  assert.equal(relativeDay('2026-10-05', '2026-09-29'), null);
  assert.equal(fmtVisibility(180, 'en'), '180 m');
  assert.equal(fmtVisibility(4500, 'hi'), '4.5 किमी');
  assert.equal(fmtAgo(25 * 60000, 'en'), '25 min');
  assert.equal(compassWord('SW', 'hi'), 'दक्षिण-पश्चिम');
  assert.equal(fmtTemp(33.6), '34°');
  assert.equal(fmtTemp(null), '–');
});

// ── card text ──
const tStub = (key, params = {}) => {
  const vars = Object.entries(params).filter(([k]) => k !== 'defaultValue').map(([k, v]) => `${k}=${v}`).join(',');
  return vars ? `${key}{${vars}}` : key;
};

test('card text formats params: times, categories, verdicts', () => {
  const umbrella = { kind: 'tip', ruleId: 'general.umbrella', params: { time: at(DATE, 16), startsAt: at(DATE, 16), prob: 70, mm: 2 }, chips: ['umbrella'] };
  const txt = cardText(umbrella, { t: tStub, lang: 'en', today: DATE });
  assert.equal(txt.headline, 'rules.general.umbrella.headline{time=4 PM,startsAt=4 PM,prob=70,mm=2}');
  assert.equal(txt.why, 'rules.general.umbrella.why');
  const aqi = cardText({ kind: 'tip', ruleId: 'general.aqiPoor', params: { aqi: 268, category: 'poor' } }, { t: tStub, lang: 'en', today: DATE });
  assert.match(aqi.headline, /category=aqi\.category\.poor/);
  const uv = cardText({ kind: 'tip', ruleId: 'health.uvHigh', params: { uv: 9, category: 'very_high', start: at(DATE, 11) } }, { t: tStub, lang: 'en', today: DATE });
  assert.match(uv.headline, /category=uv\.category\.very_high/);
  const leave = cardText({ kind: 'tip', ruleId: 'commute.leave', params: { verdict: 'leave_by', time: at(DATE, 17, 45), departure: at(DATE, 18, 30) } }, { t: tStub, lang: 'en', today: DATE });
  assert.match(leave.headline, /verdicts\.commute\.leave_by\{time=5:45 PM\}/);
  assert.equal(fmtWhen(at('2026-09-30', 6), { t: tStub, lang: 'en', today: DATE }), 'common.tomorrowAt{time=6 AM}');
  assert.equal(fmtWhen('2026-09-30', { t: tStub, lang: 'en', today: DATE }), 'common.tomorrow');
});

test('official card text: hazard, level word, action, advice, add-ons', () => {
  const card = {
    kind: 'official',
    params: { hazard: 'heat_wave', level: 3, text: 'Heat wave conditions very likely.', validFrom: at(DATE, 8), validTo: at('2026-09-30', 8, 30), issuer: 'IMD' },
    adviceKey: 'officialAdvice.heat.orange',
    addOns: [{ ruleId: 'general.heat', params: { hi: 45, time: at(DATE, 13) } }],
  };
  const txt = cardText(card, { t: tStub, lang: 'en', today: DATE });
  assert.equal(txt.headline, 'hazards.heat_wave · levels.orange · common.today');
  assert.equal(txt.reason, 'Heat wave conditions very likely.', 'official text is verbatim');
  assert.equal(txt.action, 'levels.action.orange');
  assert.equal(txt.advice, 'officialAdvice.heat.orange');
  assert.equal(txt.addOns.length, 1);
  assert.match(txt.validTo, /tomorrowAt/);
  assert.match(cardSpeech(txt), /^hazards\.heat_wave/);
});

// ── personal view ──
test('personal view: cards and ranking from stores, with commute places as coordinates', () => {
  const places = [
    { id: 'h', name: 'Home', lat: 19.0, lon: 72.8, type: 'home' },
    { id: 'w', name: 'Office', lat: 19.1, lon: 72.9, type: 'work' },
  ];
  const s = ruleSettings({ personaSettings: { commute: { times: ['08:30', null] } }, places, trips: [{ id: 't' }], events: [] });
  assert.deepEqual(s.commute.times, ['08:30']);
  assert.deepEqual(s.commute.home, { lat: 19.0, lon: 72.8, name: 'Home' });
  assert.equal(s.travel.trips.length, 1);

  const now = Date.parse('2026-09-30T14:10:00+05:30');
  const v = personalView({
    snapshot: buildScenario('mumbai-monsoon-red', now),
    now,
    personas: [{ id: 'commute', role: 'primary' }],
    places,
    personaSettings: { commute: { times: ['18:30'] } },
    availableWidgets: ['commuteNow', 'rainSoon', 'hourly', 'daily', 'aqi'],
  });
  assert.equal(v.cards[0].kind, 'official');
  assert.equal(v.season, 'monsoon');
  assert.ok(v.ranked.every((w) => ['commuteNow', 'rainSoon', 'hourly', 'daily', 'aqi'].includes(w.id)), 'only available widgets');
  assert.equal(v.ranked[0].rankReason.urgent, 'official', 'rain widgets are boosted by the Red warning');
});

test('personal view on a calm day for a citizen yields a GOOD card', () => {
  const now = Date.parse(at(DATE, 10));
  const v = personalView({ snapshot: snapshot(), now, personas: [{ id: 'citizen', role: 'primary' }] });
  assert.ok(v.cards.some((c) => c.kind === 'good'));
  assert.ok(v.ranked.findIndex((w) => w.id === 'hourly') <= 5);
  const withWarning = personalView({ snapshot: snapshot({ warnings: [warning()], hourly: hours() }), now, personas: [{ id: 'citizen', role: 'primary' }] });
  assert.equal(withWarning.cards[0].kind, 'official');
});
