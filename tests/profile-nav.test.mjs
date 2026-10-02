// Navigation (PRD section 4.2, task T0.2). The file name is kept from the
// SaathiSync suite so history stays traceable.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

import { NAV_ITEMS, MOBILE_TABS, FOOTER_LINKS, isActive } from '../src/config/navItems.js';

const en = JSON.parse(readFileSync(new URL('../src/locales/en/translation.json', import.meta.url), 'utf8'));
const hi = JSON.parse(readFileSync(new URL('../src/locales/hi/translation.json', import.meta.url), 'utf8'));
const navbarSource = readFileSync(new URL('../src/components/Navbar/navbar.js', import.meta.url), 'utf8');
const get = (obj, key) => key.split('.').reduce((o, k) => o?.[k], obj);

test('sidebar has the navigation items in order with Font Awesome solid icons', () => {
  assert.deepEqual(NAV_ITEMS.map((i) => i.id), [
    'home', 'alerts', 'forecast', 'map', 'skySnap', 'report', 'ready', 'learn', 'settings',
  ]);
  for (const item of NAV_ITEMS) assert.match(item.icon, /^fa-solid fa-/);
});

test('mobile tab bar has five items with Snap raised in the centre', () => {
  assert.deepEqual(MOBILE_TABS.map((i) => i.id), ['home', 'alerts', 'snap', 'map', 'more']);
  assert.equal(MOBILE_TABS[2].raised, true);
});

test('every nav and footer label resolves in English and Hindi', () => {
  for (const { labelKey } of [...NAV_ITEMS, ...MOBILE_TABS, ...FOOTER_LINKS]) {
    assert.ok(get(en, labelKey)?.trim(), `en ${labelKey}`);
    assert.ok(get(hi, labelKey)?.trim(), `hi ${labelKey}`);
  }
});

test('nothing in the shared lists is auth-gated; navbar renders the shared list', () => {
  assert.ok([...NAV_ITEMS, ...MOBILE_TABS].every((i) => i.href !== '/logout' && i.href !== '/login'));
  assert.ok(navbarSource.includes("from '../../config/navItems'"));
});

test('every linked route has a page', () => {
  const hrefs = [...NAV_ITEMS, ...MOBILE_TABS, ...FOOTER_LINKS].map((i) => i.href).filter(Boolean);
  for (const href of new Set(hrefs)) {
    const file = href === '/' ? '../src/app/page.js' : `../src/app${href}/page.js`;
    assert.ok(existsSync(new URL(file, import.meta.url)), `${href} has no page`);
  }
});

test('active state matches the section, and Home only matches itself', () => {
  assert.equal(isActive('/', '/'), true);
  assert.equal(isActive('/', '/alerts'), false);
  assert.equal(isActive('/learn', '/learn/heat'), true);
  assert.equal(isActive('/learn', '/learner'), false);
  assert.equal(isActive(null, '/'), false);
});
