"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import Dialog from '../shared/Dialog';
import { NAV_ITEMS } from '../../config/navItems';
import { PERSONAS } from '../../config/personas';
import { usePersonas } from '../../lib/context/WeatherProvider';

const PERSONA_PAGES = PERSONAS.filter((p) => p.page && p.tile);

/**
 * "My pages" panel (sidebar) and "More" sheet (mobile), PRD 4.2. My pages
 * lists the persona pages the user chose; every page stays reachable from
 * "All pages", so nothing is hidden permanently.
 */
export default function PagesSheet({ open, onClose, variant }) {
  const { t } = useTranslation();
  const { ids } = usePersonas();
  const mine = PERSONA_PAGES.filter((p) => ids.includes(p.id) || (p.id === 'coast' && ids.includes('fisher')));
  const others = PERSONA_PAGES.filter((p) => !mine.includes(p));
  const link = (p) => (
    <li key={p.id}>
      <Link href={p.page} onClick={onClose}>
        <i className={p.icon} aria-hidden="true"></i> {t(p.nameKey)}
      </Link>
    </li>
  );
  return (
    <Dialog open={open} onClose={onClose} title={variant === 'more' ? t('nav.more') : t('nav.myDay')}>
      {mine.length ? <ul className="ms-sheet-list">{mine.map(link)}</ul> : <p className="ms-muted">{t('home.noPersonaPages')}</p>}
      <h3 className="ms-sheet-sub">{t('nav.allPages')}</h3>
      <ul className="ms-sheet-list">
        {others.map(link)}
        {variant === 'more'
          ? NAV_ITEMS.filter((i) => i.href && i.href !== '/').map((i) => (
              <li key={i.id}>
                <Link href={i.href} onClick={onClose}>
                  <i className={i.icon} aria-hidden="true"></i> {t(i.labelKey)}
                </Link>
              </li>
            ))
          : null}
        <li>
          <Link href="/household" onClick={onClose}>
            <i className="fa-solid fa-people-roof" aria-hidden="true"></i> {t('pages.household.title')}
          </Link>
        </li>
        <li>
          <Link href="/sitemap" onClick={onClose}>
            <i className="fa-solid fa-sitemap" aria-hidden="true"></i> {t('footer.sitemap')}
          </Link>
        </li>
      </ul>
    </Dialog>
  );
}
