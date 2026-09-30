import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

import { ORIGINAL_NAV_ITEMS } from '../src/config/navItems.js';

const en = JSON.parse(
  readFileSync(new URL('../src/locales/en/translation.json', import.meta.url), 'utf8'),
);
const hi = JSON.parse(
  readFileSync(new URL('../src/locales/hi/translation.json', import.meta.url), 'utf8'),
);
const navbarSource = readFileSync(
  new URL('../src/components/Navbar/navbar.js', import.meta.url),
  'utf8',
);

test('base nav list links to /profile with the project icon/label convention', () => {
  const profile = ORIGINAL_NAV_ITEMS.find((item) => item.href === '/profile');
  assert.ok(profile, 'expected a /profile entry in the base nav list');
  assert.equal(profile.labelKey, 'nav.profile');
  assert.ok(
    typeof profile.icon === 'string' && profile.icon.startsWith('fa-solid fa-'),
    'expected a FontAwesome solid icon like the other entries',
  );
});

test('profile nav entry is guest-visible (logout stays the only auth-gated item)', () => {
  // The shared list must not contain auth-gated entries: navbar.js appends
  // /logout only for signed-in users, so everything here — including
  // /profile — renders for Guest Mode too.
  assert.ok(
    ORIGINAL_NAV_ITEMS.every((item) => item.href !== '/logout'),
    'logout must not be in the shared guest-visible list',
  );
  assert.ok(ORIGINAL_NAV_ITEMS.some((item) => item.href === '/profile'));
  assert.ok(
    navbarSource.includes("from '../../config/navItems'"),
    'navbar must render the shared list (single source of truth)',
  );
  assert.ok(
    navbarSource.includes("href: '/logout'"),
    'logout is still appended separately for signed-in users',
  );
});

test('profile label resolves in English and Hindi', () => {
  assert.ok(
    typeof en.nav.profile === 'string' && en.nav.profile.trim().length > 0,
    'en nav.profile must be a non-empty label',
  );
  assert.ok(
    typeof hi.nav.profile === 'string' && hi.nav.profile.trim().length > 0,
    'hi nav.profile must be a non-empty label',
  );
});

test('/profile route exists and renders without an auth gate', () => {
  assert.ok(existsSync(new URL('../src/app/profile/page.js', import.meta.url)));
  const viewSource = readFileSync(
    new URL('../src/views/profile.js', import.meta.url),
    'utf8',
  );
  assert.ok(viewSource.includes('Profile'));
  // The view must not introduce an auth redirect/guard for /profile.
  assert.ok(!/redirect|requireAuth|withAuth/i.test(viewSource));
});
