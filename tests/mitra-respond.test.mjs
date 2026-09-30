// Mausam Mitra end to end (PRD 10.3, 10.6, 10.7) on the demo scenarios:
// grounded answers in the question's language, no raw keys or unfilled
// variables, under 60 words, emergencies first, honest when data is
// missing.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { respond } from '../src/lib/mitra/respond.js';
import { detectLang } from '../src/lib/mitra/normalise.js';
import { buildScenario } from '../src/data/fixtures/scenarios.js';

const tree = (l) => JSON.parse(readFileSync(new URL(`../src/locales/${l}/translation.json`, import.meta.url), 'utf8'));
const TREES = { en: tree('en'), hi: tree('hi') };
function tFor(lang) {
  return (key, vars = {}) => {
    const v = key.split('.').reduce((o, k) => (o && typeof o === 'object' ? o[k] : undefined), TREES[lang]);
    if (typeof v !== 'string') return vars.defaultValue ?? key;
    return v.replace(/\{\{(\w+)\}\}/g, (m, k) => (vars[k] == null ? m : String(vars[k])));
  };
}

const NOW = Date.parse('2026-09-30T08:10:00+05:30');
function env(scenario, over = {}) {
  const snapshot = buildScenario(scenario, NOW);
  return {
    uiLang: 'en',
    tFor,
    now: NOW,
    place: snapshot.place,
    places: [],
    snapshot,
    personas: ['citizen'],
    personaSettings: {},
    reports: [],
    getSnapshot: async () => snapshot,
    geocode: async (q) => (q === 'shimla' ? { id: 'g-shimla', name: 'Shimla', lat: 31.1, lon: 77.17 } : null),
    ...over,
  };
}

const all = (r) => [r.text, ...(r.lines || []), r.source || ''].join(' ');
function clean(r, label) {
  const text = all(r);
  assert.ok(!/\{\{\w+\}\}/.test(text), `${label}: unfilled variable in "${text}"`);
  assert.ok(!/\b(mitra|widgets|verdicts|levels|hazards|common|rules)\.[a-zA-Z_.]+/.test(text), `${label}: raw key in "${text}"`);
  assert.ok(!/undefined|NaN|null/.test(text), `${label}: bad value in "${text}"`);
  const words = [r.text, ...(r.lines || [])].join(' ').split(/\s+/).filter(Boolean).length;
  assert.ok(words <= 60, `${label}: ${words} words`);
}

const QUESTIONS = [
  'weather now', 'aaj ka mausam', 'kal pune mein mausam', 'will it rain today', 'do I need an umbrella', 'how hot will it get',
  'air quality', 'UV today', 'best time to run tomorrow', 'is it safe to swim', 'tide times', 'can we go fishing tomorrow',
  'weather in shimla next week', 'fog at delhi airport tomorrow', 'what should I pack', 'school time weather', 'can I spray today',
  'rain this week for my farm', 'frost tonight', 'should I leave now', 'fog tomorrow morning', 'any warnings', 'what to do in lightning',
  'how does this app decide', 'hello', 'thanks', 'tell me a joke',
];

for (const scenario of ['mumbai-monsoon-red', 'delhi-winter-smog-fog', 'goa-swell-alert', 'punjab-village-frost', 'lucknow-heatwave', 'chennai-cyclone']) {
  test(`every intent answers cleanly in ${scenario} (en and hi)`, async () => {
    for (const q of QUESTIONS) {
      const r = await respond(q, env(scenario));
      const expected = r.kind === 'switch' ? r.switchTo : detectLang(q);
      assert.equal(r.lang, expected, q);
      clean(r, `${scenario} ${r.lang} "${q}"`);
      const rh = await respond(q, env(scenario, { uiLang: 'hi' }));
      // The question's language wins over the UI language.
      assert.equal(rh.lang, expected, q);
    }
    for (const q of ['बारिश कब होगी', 'आज का मौसम', 'हवा कैसी है', 'कोई चेतावनी है?', 'kal subah baarish hogi?', 'garmi kitni hogi']) {
      const r = await respond(q, env(scenario));
      assert.equal(r.lang, 'hi', q);
      assert.ok(/[ऀ-ॿ]/.test(r.text), `${q}: reply should be in Hindi: ${r.text}`);
      clean(r, `${scenario} hi "${q}"`);
    }
  });
}

test('emergencies escalate first with 112 and 108, never "safe"', async () => {
  for (const q of ['ghar mein paani aa gaya, bachao', 'help', 'loo lag gayi', 'बिजली गिरी', 'boat missing']) {
    const r = await respond(q, env('mumbai-monsoon-red'));
    assert.equal(r.kind, 'emergency', q);
    assert.deepEqual(r.calls.slice(0, 2), ['112', '108']);
    assert.ok(!/\bsafe\b|सुरक्षित हैं/i.test(all(r)), q);
    clean(r, q);
  }
  const hi = await respond('घर में पानी आ गया', env('mumbai-monsoon-red'));
  assert.equal(hi.lang, 'hi');
  assert.match(hi.text, /112/);
});

test('safety questions never get a bare yes or no', async () => {
  const r = await respond('is it safe to swim at juhu', env('mumbai-monsoon-red'));
  assert.match(r.text, /^No, stay out of the water at Juhu now: .+/);
  const f = await respond('can we go fishing tomorrow', env('chennai-cyclone'));
  assert.match(f.text, /Do not go to sea tomorrow: official warning for fishermen/);
});

test('official warnings are listed, and "couldn\'t check" is honest', async () => {
  const r = await respond('any warnings', env('mumbai-monsoon-red'));
  assert.match(r.text, /official warnings for Mumbai/);
  assert.ok(r.lines.some((l) => /^RED: /.test(l)));
  const e = env('lucknow-heatwave');
  e.snapshot = { ...e.snapshot, warnings: [], warningsStatus: 'unavailable' };
  const u = await respond('any warnings', e);
  assert.match(u.text, /couldn't check official warnings/);
  assert.ok(!/No official warnings/.test(u.text));
});

test('numbers in answers come from the snapshot', async () => {
  const e = env('lucknow-heatwave');
  const r = await respond('weather now', e);
  const c = e.snapshot.current;
  assert.ok(r.text.includes(`${Math.round(c.tempC)}°`), r.text);
  assert.ok(r.text.includes(`${Math.round(c.rh)}%`), r.text);
  const a = await respond('air quality', env('delhi-winter-smog-fog'));
  assert.ok(a.text.includes(String(env('delhi-winter-smog-fog').snapshot.air.aqi)), a.text);
});

test('places: named city, geocoded name, unknown name falls back and says so', async () => {
  const seen = [];
  const e = env('lucknow-heatwave', { getSnapshot: async (p) => (seen.push(p.name), buildScenario('lucknow-heatwave', NOW)) });
  await respond('kal pune mein mausam', e);
  await respond('weather in shimla next week', e);
  assert.deepEqual(seen, ['Pune', 'Shimla']);
  const r = await respond('weather in atlantisville tomorrow', e);
  assert.match(r.text, /couldn't find “atlantisville”/);
  // No place named: the answer says which place it used.
  const cur = await respond('will it rain today', e);
  assert.match(cur.text, /Lucknow/);
  const noName = await respond('can I spray today', e);
  assert.match(noName.text, /^For Lucknow: /);
});

test('language switch and settings-dependent intents', async () => {
  const s = await respond('Hindi mein batao', env('lucknow-heatwave'));
  assert.equal(s.kind, 'switch');
  assert.equal(s.switchTo, 'hi');
  const noTimes = await respond('should I leave now', env('mumbai-monsoon-red'));
  assert.match(noTimes.text, /Set your usual leaving times/);
  const withTimes = await respond('should I leave now', env('mumbai-monsoon-red', { personaSettings: { commute: { times: ['09:00'], travelMin: 45 } } }));
  assert.match(withTimes.text, /For your 9 am trip: .+/i);
  const school = await respond('school time weather', env('delhi-winter-smog-fog', { personaSettings: { family: { schoolTimes: { morning: '07:30' } } } }));
  assert.ok(/Drop-off/.test(school.text), school.text);
});

test('demo data is labelled as demo in the source line', async () => {
  const r = await respond('weather now', env('mumbai-monsoon-red'));
  assert.match(r.source, /demo data/);
});
