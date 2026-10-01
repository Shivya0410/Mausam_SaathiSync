// Part 2 page logic: grid packing, onboarding suggestions, notifications,
// alerts grouping, stable card order, planners, cool spots, planting guide
// and the widget registry. Pure modules only.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { packRows, SPAN } from '../src/lib/mausam/gridPack.js';
import { suggestPersonas } from '../src/lib/mausam/onboarding.js';
import { inQuietHours, pickNotifications, effectiveNotify, MAX_PER_DAY } from '../src/lib/mausam/notify.js';
import { warningsByDay, alertSections } from '../src/lib/mausam/warnings.js';
import { stableOrder, summaryText } from '../src/lib/mausam/cardText.js';
import { weekendPlan, dateComfort, mmss } from '../src/lib/mausam/plans.js';
import { coolSpotsNear, COOL_SPOTS } from '../src/data/coolSpots/index.js';
import { zoneForState, sowingSeason, containerPlants } from '../src/data/plantingGuide.js';
import { AVAILABLE_WIDGETS } from '../src/components/widgets/available.js';
import { WIDGETS } from '../src/config/widgets.js';
import { at, DATE, snapshot, warning, hours, days, ctx } from './helpers/weather.mjs';

const en = JSON.parse(readFileSync(new URL('../src/locales/en/translation.json', import.meta.url), 'utf8'));
const lookup = (key) => key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), en);
const t = (key, vars = {}) => {
  const v = lookup(key);
  if (typeof v !== 'string') return key;
  return v.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
};

// ── Grid packing ──
test('packRows keeps rank order when everything fits', () => {
  const items = [{ id: 'a', size: 'full' }, { id: 'b', size: 'half' }, { id: 'c', size: 'half' }];
  assert.deepEqual(packRows(items).map((i) => i.id), ['a', 'b', 'c']);
});

test('packRows pulls a later widget forward to fill a row gap', () => {
  const items = [{ id: 'a', size: 'half' }, { id: 'b', size: 'full' }, { id: 'c', size: 'half' }];
  assert.deepEqual(packRows(items).map((i) => i.id), ['a', 'c', 'b']);
});

test('packRows only looks a few items ahead and never drops items', () => {
  const items = [{ id: 'a', size: 'half' }, ...['b', 'c', 'd', 'e'].map((id) => ({ id, size: 'full' })), { id: 'f', size: 'half' }];
  const out = packRows(items);
  assert.equal(out.length, items.length);
  assert.equal(out[1].id, 'b', 'f is beyond the look-ahead, so the row stays open');
  assert.equal(SPAN.third, 4);
});

// ── Onboarding suggestions ──
test('suggestPersonas: coast near a beach, farm for villages, health in northern winter', () => {
  const goa = { lat: 15.5, lon: 73.76 };
  assert.ok(suggestPersonas({ place: goa, month: 6, beaches: [{ lat: 15.51, lon: 73.77 }] }).includes('coast'));
  assert.ok(suggestPersonas({ place: { lat: 26.1, lon: 80.2, featureCode: 'PPL' }, month: 6 }).includes('farm'));
  assert.ok(suggestPersonas({ place: { lat: 28.6, lon: 77.2 }, month: 12 }).includes('health'));
  assert.deepEqual(suggestPersonas({ place: { lat: 12.97, lon: 77.59, featureCode: 'PPLA' }, month: 6 }), []);
  assert.deepEqual(suggestPersonas({ place: null, month: 6 }), []);
});

// ── Notifications ──
const NOTIFY = { official: true, yellow: false, quietFrom: '22:00', quietTo: '06:00', seen: [], sentToday: null };
const ms = (iso) => Date.parse(iso);

test('inQuietHours handles a window across midnight', () => {
  assert.equal(inQuietHours(ms(at(DATE, 23)), 330), true);
  assert.equal(inQuietHours(ms(at(DATE, 5, 59)), 330), true);
  assert.equal(inQuietHours(ms(at(DATE, 6)), 330), false);
  assert.equal(inQuietHours(ms(at(DATE, 14)), 330, '13:00', '15:00'), true);
  assert.equal(inQuietHours(ms(at(DATE, 14)), 330, '10:00', '10:00'), false);
});

test('pickNotifications sends Orange and Red once, skips Yellow and demo warnings', () => {
  const ws = [
    warning({ id: 'o', level: 3 }),
    warning({ id: 'y', level: 2 }),
    warning({ id: 'd', level: 4, demo: true }),
  ];
  const first = pickNotifications(ws, NOTIFY, ms(at(DATE, 10)));
  assert.deepEqual(first.toSend.map((w) => w.id), ['o']);
  const again = pickNotifications(ws, { ...NOTIFY, seen: first.seen, sentToday: first.sentToday }, ms(at(DATE, 11)));
  assert.equal(again.toSend.length, 0, 'announced once');
  const upgraded = pickNotifications([warning({ id: 'o', level: 4 })], { ...NOTIFY, seen: first.seen }, ms(at(DATE, 12)));
  assert.equal(upgraded.toSend.length, 1, 'an upgrade to Red is announced again');
  assert.equal(pickNotifications(ws, { ...NOTIFY, yellow: true }, ms(at(DATE, 10))).toSend.length, 2);
});

test('pickNotifications: quiet hours and the daily cap hold back all but Red', () => {
  const night = ms(at(DATE, 23));
  const ws = [warning({ id: 'o', level: 3 }), warning({ id: 'r', level: 4 })];
  assert.deepEqual(pickNotifications(ws, NOTIFY, night).toSend.map((w) => w.id), ['r']);
  const capped = { ...NOTIFY, sentToday: { date: DATE, count: MAX_PER_DAY } };
  assert.deepEqual(pickNotifications(ws, capped, ms(at(DATE, 10))).toSend.map((w) => w.id), ['r']);
  assert.equal(pickNotifications(ws, { ...NOTIFY, official: false }, ms(at(DATE, 10))).toSend.length, 0);
});

test('pickNotifications never announces an expired warning (E8)', () => {
  const now = ms(at(DATE, 10));
  const expired = warning({ id: 'old', level: 4, validTo: at(DATE, 9) });
  assert.equal(pickNotifications([expired], NOTIFY, now).toSend.length, 0);
});

test('effectiveNotify defaults rain and lightning alerts from personas', () => {
  assert.equal(effectiveNotify({}, ['commute']).rainHour, true);
  assert.equal(effectiveNotify({}, ['health']).rainHour, false);
  assert.equal(effectiveNotify({}, ['fitness']).lightning, true);
  assert.equal(effectiveNotify({ lightning: false }, ['fitness']).lightning, false, 'explicit choice wins');
});

// ── Alerts page grouping ──
test('warningsByDay gives 5 days with the highest level and hazards per day', () => {
  const ws = [
    warning({ id: 'a', level: 3, hazard: 'heavy_rain', validFrom: at(DATE, 8), validTo: at('2026-09-30', 8) }),
    warning({ id: 'b', level: 2, hazard: 'thunderstorm', validFrom: at('2026-09-30', 8), validTo: at('2026-09-30', 20) }),
  ];
  const d = warningsByDay(ws, DATE, 5);
  assert.equal(d.length, 5);
  assert.equal(d[0].level, 3);
  assert.equal(d[1].level, 3);
  assert.deepEqual(d[1].hazards.sort(), ['heavy_rain', 'thunderstorm']);
  assert.equal(d[2].level, 1);
  assert.deepEqual(d[2].hazards, []);
});

test('alertSections splits by source and hazard', () => {
  const s = alertSections([
    warning({ id: 'n', source: 'imd_nowcast' }),
    warning({ id: 'c', source: 'ndma_cap' }),
    warning({ id: 'm', source: 'imd_marine', hazard: 'high_waves' }),
    warning({ id: 'y', source: 'imd_district', hazard: 'cyclone' }),
  ]);
  assert.deepEqual(s.nowcast.map((w) => w.id), ['n']);
  assert.deepEqual(s.disaster.map((w) => w.id), ['c']);
  assert.deepEqual(s.marine.map((w) => w.id), ['m']);
  assert.deepEqual(s.cyclone.map((w) => w.id), ['y']);
});

// ── Card order and summary ──
test('stableOrder keeps the previous order only when nothing changed in severity', () => {
  const prev = [{ id: 'b', severity: 2 }, { id: 'a', severity: 1 }];
  const cards = [{ id: 'a', severity: 1 }, { id: 'b', severity: 2 }];
  assert.deepEqual(stableOrder(prev, cards).map((c) => c.id), ['b', 'a']);
  const changed = [{ id: 'a', severity: 3 }, { id: 'b', severity: 2 }];
  assert.deepEqual(stableOrder(prev, changed).map((c) => c.id), ['a', 'b']);
  assert.deepEqual(stableOrder([], cards), cards);
});

test('summaryText builds one sentence with greeting, band and change', () => {
  const s = { greetingKey: 'home.greeting.morning', tempBand: 'hot', humid: true, placeName: 'Lucknow', change: { type: 'rain', time: at(DATE, 16) } };
  const text = summaryText(s, { t, lang: 'en' });
  assert.match(text, /^Good morning\. Hot and humid in Lucknow, rain likely from 4(:00)? pm\.$/i);
  assert.equal(summaryText({ greetingKey: 'home.greeting.night', placeName: 'Delhi' }, { t, lang: 'en' }), 'Good night. Weather for Delhi.');
});

// ── Planners ──
test('weekendPlan returns Saturday and Sunday with slot scores', () => {
  const snap = snapshot({ hourly: hours({ days: 8 }), daily: days() });
  const plan = weekendPlan(ctx({ snap }), DATE);
  assert.deepEqual(plan.map((d) => d.date), ['2026-10-03', '2026-10-04']);
  for (const d of plan) {
    assert.deepEqual(d.slots.map((s) => s.slot), ['morning', 'afternoon', 'evening']);
    for (const s of d.slots) assert.ok(s.score >= 0 && s.score <= 100);
  }
});

test('dateComfort scores a forecast date and returns null beyond it', () => {
  const c = ctx();
  const r = dateComfort(c, DATE, 'evening');
  assert.ok(r && Number.isFinite(r.score));
  assert.equal(r.day.date, DATE);
  assert.equal(dateComfort(c, '2027-01-01', 'evening'), null);
  assert.ok(dateComfort(c, DATE, 'no-such-slot'), 'falls back to evening');
});

test('mmss formats the lightning timer', () => {
  assert.equal(mmss(30 * 60 * 1000), '30:00');
  assert.equal(mmss(61 * 1000 + 1), '01:02');
  assert.equal(mmss(-5), '00:00');
});

// ── Data ──
test('coolSpotsNear finds spots near a city, nearest first, and none far away', () => {
  const delhi = { lat: 28.61, lon: 77.21 };
  const near = coolSpotsNear(delhi, 25);
  assert.ok(near.length > 0);
  for (let i = 1; i < near.length; i++) assert.ok(near[i].distanceM >= near[i - 1].distanceM);
  assert.deepEqual(coolSpotsNear({ lat: 10, lon: 60 }), []);
  assert.deepEqual(coolSpotsNear(null), []);
  for (const spot of Object.values(COOL_SPOTS).flat()) assert.ok(en.coolSpotTypes[spot.type], spot.type);
});

test('zoneForState, sowingSeason and containerPlants cover the year', () => {
  assert.ok(zoneForState('Punjab'));
  assert.ok(zoneForState(' uttar pradesh '));
  assert.ok(zoneForState('Assam'));
  assert.equal(zoneForState('Atlantis'), null);
  assert.equal(zoneForState(null), null);
  const seasons = Array.from({ length: 12 }, (_, i) => sowingSeason(i + 1));
  assert.deepEqual([...new Set(seasons)].sort(), ['kharif', 'rabi', 'zaid']);
  for (let m = 1; m <= 12; m++) assert.ok(containerPlants(m).length > 0);
  for (const s of new Set(seasons)) assert.ok(en.seasons[s], s);
});

// ── Widget registry ──
test('AVAILABLE_WIDGETS matches the component registry and the widget config', () => {
  const src = readFileSync(new URL('../src/components/widgets/index.js', import.meta.url), 'utf8');
  const body = src.slice(src.indexOf('WIDGET_COMPONENTS'));
  const registered = [...body.matchAll(/^\s+(\w+):/gm)].map((m) => m[1]);
  assert.deepEqual([...registered].sort(), [...AVAILABLE_WIDGETS].sort());
  const configured = new Set(WIDGETS.map((w) => w.id));
  for (const id of AVAILABLE_WIDGETS) assert.ok(configured.has(id), id);
  for (const id of configured) assert.ok(lookup(`widgets.${id}.title`), `title for ${id}`);
});

// ── Card text completeness ──
import { personalView } from '../src/lib/mausam/personal.js';
import { cardText } from '../src/lib/mausam/cardText.js';
import { buildScenario, SCENARIO_IDS } from '../src/data/fixtures/scenarios.js';
import { PERSONA_IDS } from '../src/config/personas.js';

const hiTree = JSON.parse(readFileSync(new URL('../src/locales/hi/translation.json', import.meta.url), 'utf8'));
function makeT(tree) {
  const t = (key, vars = {}) => {
    const v = key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), tree);
    if (typeof v !== 'string') return vars.defaultValue ?? key;
    return v.replace(/\{\{(\w+)\}\}/g, (m, k) => (vars[k] == null ? m : String(vars[k])));
  };
  return t;
}

test('every card in every demo scenario renders with no raw keys or unfilled {{vars}} (en and hi)', () => {
  const problems = new Set();
  const settings = {
    commute: { times: ['09:00', '18:30'], mode: 'two_wheeler', travelMin: 45 },
    family: { schoolTimes: { morning: '07:30', afternoon: '14:00' } },
    fitness: { activity: 'run', band: 'morning', durationMin: 45 },
    work: { hours: ['09:00', '18:00'], type: 'delivery' },
    farm: { role: 'farmer' },
  };
  for (const id of SCENARIO_IDS) {
    for (const hh of [6, 11, 15, 20]) {
      const base = Date.parse(`2026-09-30T${String(hh).padStart(2, '0')}:10:00+05:30`);
      const snap = buildScenario(id, base);
      for (const p of PERSONA_IDS) {
        const v = personalView({ snapshot: snap, now: base, personas: [{ id: p, role: 'primary' }], personaSettings: settings, sensitivities: ['asthma', 'elderly'] });
        for (const card of v.cards) {
          for (const [lang, tree] of [['en', en], ['hi', hiTree]]) {
            const txt = cardText(card, { t: makeT(tree), lang, today: v.ctx.today });
            const all = [txt.headline, txt.reason, txt.why, txt.action, txt.advice, ...(txt.addOns || [])].filter(Boolean).join(' | ');
            const bad = all.match(/\{\{\w+\}\}|\b(rules|verdicts|levels|hazards)\.[\w.]+/g);
            if (bad) problems.add(`${lang} ${card.ruleId}: ${[...new Set(bad)].join(', ')}`);
          }
        }
      }
    }
  }
  assert.deepEqual([...problems].sort(), []);
});

test('scenario id list matches the fixture builder', async () => {
  const ids = await import('../src/data/fixtures/scenarioIds.js');
  const full = await import('../src/data/fixtures/scenarios.js');
  assert.deepEqual([...ids.SCENARIO_IDS].sort(), [...full.SCENARIO_IDS].sort());
});

// ── Early snapshot request (PRD 13.8) ──
test('the <head> prefetch URL equals the URL the app requests first', async () => {
  const { snapshotPrefetchUrl, prefetchScript } = await import('../src/lib/prefetchSnapshot.js');
  const { snapshotUrl } = await import('../src/lib/hooks/useSnapshot.js');
  const { DEFAULT_PLACE, resolveCurrentPlace } = await import('../src/lib/stores/index.js');
  const { SCENARIO_IDS } = await import('../src/data/fixtures/scenarioIds.js');
  const cfg = { demoMode: true, scenarioIds: [...SCENARIO_IDS], defaultPlace: DEFAULT_PLACE };
  const pune = { id: 'p1', name: 'Pune', district: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, type: 'home' };
  const goa = { id: 'p2', name: 'Calangute', state: 'Goa', lat: 15.54, lon: 73.76 };
  const cases = [
    { store: {}, search: '', expect: { place: DEFAULT_PLACE, include: 'air,warnings,sun' } },
    { store: { 'mausam.places.v1::guest': [pune, goa], 'mausam.currentPlace.v1::guest': { id: 'p2' } }, search: '', expect: { place: goa, include: 'air,warnings,sun' } },
    { store: { 'mausam.places.v1::guest': [pune], 'mausam.personas.v1::guest': { primary: 'fisher', secondary: [] } }, search: '', expect: { place: pune, include: 'air,warnings,sun,marine' } },
    { store: { 'mausam.a11y.v1': { lite: true } }, search: '', expect: { place: DEFAULT_PLACE, include: 'warnings,sun' } },
    { store: {}, search: '?demo=mumbai-monsoon-red', expect: { place: DEFAULT_PLACE, include: 'air,warnings,sun,marine', demo: 'mumbai-monsoon-red' } },
    { store: { 'mausam.demo.v1': { scenario: 'goa-swell-alert' } }, search: '?demo=off', expect: { place: DEFAULT_PLACE, include: 'air,warnings,sun' } },
  ];
  for (const c of cases) {
    const get = (k) => (k in c.store ? JSON.stringify(c.store[k]) : null);
    const got = snapshotPrefetchUrl(get, c.search, undefined, cfg);
    const want = snapshotUrl(resolveCurrentPlace(c.expect.place === DEFAULT_PLACE ? [] : [c.expect.place], c.expect.place.id), { include: c.expect.include, lang: 'en', demo: c.expect.demo });
    assert.equal(got, want, JSON.stringify(c.store) + c.search);
  }
  assert.equal(snapshotPrefetchUrl((k) => (k === 'token' ? 'abc' : null), '', undefined, cfg), null, 'signed-in users are skipped');
  assert.equal(snapshotPrefetchUrl(() => null, '', { saveData: true }, cfg).includes('include=warnings%2Csun&'), true, 'data saver means lite');
  // The serialised script must be valid JavaScript.
  assert.doesNotThrow(() => new Function(prefetchScript(cfg)));
});
