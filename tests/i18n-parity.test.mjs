import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { RULES } from '../src/lib/mausam/rules/index.js';
import { WMO_CODES } from '../src/lib/mausam/wmo.js';
import { HAZARDS, ADVICE_GROUPS } from '../src/lib/mausam/hazards.js';
import { AQI_CATEGORIES } from '../src/lib/mausam/indices/naqi.js';
import { PERSONA_IDS, SENSITIVITIES } from '../src/config/personas.js';
import { NAV_ITEMS, MOBILE_TABS } from '../src/config/navItems.js';

const load = (lang) =>
  JSON.parse(readFileSync(new URL(`../src/locales/${lang}/translation.json`, import.meta.url), 'utf8'));
const en = load('en');
const hi = load('hi');

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}
const fe = flatten(en);
const fh = flatten(hi);
const has = (key) => typeof fe[key] === 'string' && fe[key].trim() && typeof fh[key] === 'string' && fh[key].trim();

test('en and hi have identical key sets', () => {
  const a = Object.keys(fe).sort();
  const b = Object.keys(fh).sort();
  assert.deepEqual(a.filter((k) => !fh[k]), [], 'keys missing in hi');
  assert.deepEqual(b.filter((k) => !fe[k]), [], 'keys missing in en');
});

test('every {{variable}} in English also appears in Hindi', () => {
  const vars = (s) => new Set([...String(s).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]));
  const problems = [];
  for (const [k, v] of Object.entries(fe)) {
    const missing = [...vars(v)].filter((x) => !vars(fh[k]).has(x));
    if (missing.length) problems.push(`${k}: ${missing.join(', ')}`);
  }
  assert.deepEqual(problems, []);
});

test('no string is empty, and Hindi strings are not copies of English (except names and codes)', () => {
  assert.deepEqual(Object.entries(fe).filter(([, v]) => !String(v).trim()).map(([k]) => k), []);
  const allowSame = /^(google\.|login\.|register\.)|\{\{(text|verdict)\}\}|^common\.appName$/;
  const copies = Object.keys(fe).filter((k) => fe[k] === fh[k] && !allowSame.test(k) && !allowSame.test(fe[k]) && /[a-z]{4,}/i.test(fe[k]));
  assert.deepEqual(copies, []);
});

test('every rule has headline, reason and why in both languages', () => {
  const missing = [];
  for (const r of RULES) for (const part of ['headline', 'reason', 'why']) if (!has(`rules.${r.id}.${part}`)) missing.push(`${r.id}.${part}`);
  assert.deepEqual(missing, []);
  assert.ok(has('rules.official.why'));
});

test('every WMO code, hazard, advice row, AQI category, persona and nav item has text', () => {
  const need = [
    ...WMO_CODES.map((c) => `wmo.${c}`),
    ...HAZARDS.map((h) => `hazards.${h}`),
    ...ADVICE_GROUPS.flatMap((g) => ['yellow', 'orange', 'red'].map((l) => `officialAdvice.${g}.${l}`)),
    ...AQI_CATEGORIES.flatMap((c) => [`aqi.category.${c}`, `aqi.health.${c}`]),
    ...PERSONA_IDS.flatMap((p) => [`personas.${p}.name`, `personas.${p}.desc`]),
    ...SENSITIVITIES.map((s) => `sensitivities.${s}`),
    ...[...NAV_ITEMS, ...MOBILE_TABS].map((n) => n.labelKey),
  ];
  assert.deepEqual(need.filter((k) => !has(k)), []);
});

test('no fitness-era wording survives in the translation files (T0.1)', () => {
  const text = JSON.stringify(en) + JSON.stringify(hi);
  for (const word of ['SaathiSync', 'Swasth', 'SheFit', 'calorie', 'workout', 'दिनचर्या']) {
    assert.ok(!text.includes(word) || word === 'SaathiSync' && /टीम साथीसिंक|Team SaathiSync/.test(text) && !text.replace(/Team SaathiSync/g, '').includes('SaathiSync'), word);
  }
});
