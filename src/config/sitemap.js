/**
 * Site structure (PRD 4.3). One source for the /sitemap page (GIGW G8) and
 * for app/sitemap.js. Labels are i18n keys.
 */
import { ARTICLES } from '../data/learn.js';

export const POLICY_SLUGS = ['privacy', 'terms', 'copyright', 'hyperlinking', 'disclaimer', 'archival', 'review', 'security'];

export const SITE_TREE = [
  { href: '/', labelKey: 'nav.home' },
  { href: '/alerts', labelKey: 'nav.alerts' },
  { href: '/forecast', labelKey: 'nav.forecast' },
  { href: '/map', labelKey: 'nav.map' },
  {
    labelKey: 'nav.myDay',
    children: ['health', 'run', 'coast', 'travel', 'family', 'farm', 'commute', 'events', 'work'].map((p) => ({ href: `/${p}`, labelKey: `pages.${p}.title` })),
  },
  { href: '/sky-snap', labelKey: 'pages.skySnap.title' },
  { href: '/report', labelKey: 'pages.report.title' },
  { href: '/reports', labelKey: 'pages.reports.title' },
  { href: '/ready', labelKey: 'pages.ready.title' },
  { href: '/learn', labelKey: 'pages.learn.title', children: ARTICLES.map((a) => ({ href: `/learn/${a.slug}`, labelKey: `learn.articles.${a.slug}.title` })) },
  { href: '/household', labelKey: 'pages.household.title' },
  { href: '/settings', labelKey: 'pages.settings.title' },
  { href: '/about', labelKey: 'footer.about' },
  { href: '/help', labelKey: 'footer.help' },
  { href: '/feedback', labelKey: 'footer.feedback' },
  { href: '/contact', labelKey: 'footer.contact' },
  { href: '/accessibility', labelKey: 'footer.accessibility' },
  { href: '/screen-reader-access', labelKey: 'footer.screenReader' },
  { href: '/policies', labelKey: 'footer.policies', children: POLICY_SLUGS.map((s) => ({ href: `/policies/${s}`, labelKey: `policies.${s}.title` })) },
];

/** Every page path in the tree, for app/sitemap.js. */
export function allPaths(tree = SITE_TREE) {
  return tree.flatMap((n) => [...(n.href ? [n.href] : []), ...(n.children ? allPaths(n.children) : [])]);
}
