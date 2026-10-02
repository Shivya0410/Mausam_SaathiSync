/**
 * Main navigation (PRD section 4.2). Shared, testable definition.
 *
 * NAV_ITEMS is the desktop and tablet sidebar, in order. The "My pages"
 * entry has no href: it opens the panel of persona pages. MOBILE_TABS is
 * the bottom tab bar below 768 px; "More" opens a sheet with everything
 * else. Sign-in is optional and reachable from Settings, so nothing here
 * is auth-gated. Labels are i18n keys resolved at render time.
 */
export const NAV_ITEMS = [
  { id: 'home', href: '/', icon: 'fa-solid fa-house', labelKey: 'nav.home' },
  { id: 'alerts', href: '/alerts', icon: 'fa-solid fa-triangle-exclamation', labelKey: 'nav.alerts', badge: 'warnings' },
  { id: 'forecast', href: '/forecast', icon: 'fa-solid fa-cloud-sun-rain', labelKey: 'nav.forecast' },
  { id: 'map', href: '/map', icon: 'fa-solid fa-map-location-dot', labelKey: 'nav.map' },
  { id: 'skySnap', href: '/sky-snap', icon: 'fa-solid fa-camera', labelKey: 'nav.skySnap' },
  { id: 'report', href: '/report', icon: 'fa-solid fa-water', labelKey: 'nav.report' },
  { id: 'ready', href: '/ready', icon: 'fa-solid fa-shield-heart', labelKey: 'nav.ready' },
  { id: 'learn', href: '/learn', icon: 'fa-solid fa-book-open', labelKey: 'nav.learn' },
  { id: 'settings', href: '/settings', icon: 'fa-solid fa-sliders', labelKey: 'nav.settings' },
];

export const MOBILE_TABS = [
  { id: 'home', href: '/', icon: 'fa-solid fa-house', labelKey: 'nav.home' },
  { id: 'alerts', href: '/alerts', icon: 'fa-solid fa-triangle-exclamation', labelKey: 'nav.alerts', badge: 'warnings' },
  { id: 'snap', href: '/sky-snap', icon: 'fa-solid fa-camera', labelKey: 'nav.snap', raised: true },
  { id: 'map', href: '/map', icon: 'fa-solid fa-map-location-dot', labelKey: 'nav.map' },
  { id: 'more', href: null, icon: 'fa-solid fa-bars', labelKey: 'nav.more', panel: 'more' },
];

/** Footer links required by GIGW 3.0 (PRD sections 4.2 and 15.1). */
export const FOOTER_LINKS = [
  { href: '/about', labelKey: 'footer.about' },
  { href: '/help', labelKey: 'footer.help' },
  { href: '/feedback', labelKey: 'footer.feedback' },
  { href: '/contact', labelKey: 'footer.contact' },
  { href: '/sitemap', labelKey: 'footer.sitemap' },
  { href: '/accessibility', labelKey: 'footer.accessibility' },
  { href: '/screen-reader-access', labelKey: 'footer.screenReader' },
  { href: '/policies', labelKey: 'footer.policies' },
];

/** Whether `pathname` is inside the section `href` points to. */
export function isActive(href, pathname) {
  if (!href || !pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
