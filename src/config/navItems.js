/**
 * Main sidebar navigation items (shared, testable definition).
 *
 * Sidebar order: Home, Profile, Fitness, Wellness, Dietary, Tracker,
 * Community, Challenges, Store, SheFit.
 * Sustain (/sus) and About (/about) stay reachable by URL and via
 * the Terms/Privacy footer links. Logout is appended for signed-in users
 * in src/components/Navbar/navbar.js — it is NOT part of this list, so
 * everything here (including Profile) renders for Guest Mode users too.
 * Labels are i18n keys resolved at render time.
 */
export const ORIGINAL_NAV_ITEMS = [
  { href: '/', icon: 'fa-solid fa-house', labelKey: 'nav.home' },
  { href: '/profile', icon: 'fa-solid fa-user', labelKey: 'nav.profile' },
  { href: '/start', icon: 'fa-solid fa-dumbbell', labelKey: 'nav.fitness' },
  { href: '/wellness', icon: 'fa-solid fa-spa', labelKey: 'nav.wellness' },
  { href: '/cards', icon: 'fa-solid fa-apple-whole', labelKey: 'nav.dietary' },
  { href: '/tracker', icon: 'fa-solid fa-chart-line', labelKey: 'nav.tracker' },
  { href: '/community', icon: 'fa-solid fa-users', labelKey: 'nav.community' },
  { href: '/challenges', icon: 'fa-solid fa-trophy', labelKey: 'nav.challenges' },
  { href: '/store', icon: 'fa-solid fa-bag-shopping', labelKey: 'nav.store' },
  { href: '/she', icon: 'fa-solid fa-venus', labelKey: 'nav.shefit' },
];
