"use client";

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { MOBILE_TABS, isActive } from '../../config/navItems';
import PagesSheet from './PagesSheet';

/**
 * Mobile bottom tab bar below 768 px (PRD section 4.2): Home, Alerts, Snap
 * (raised, centre), Map, More. Placed after the footer in the DOM and fixed
 * to the bottom, so reading order stays header, main, footer.
 */
export default function BottomTabBar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButton = useRef(null);

  return (
    <nav className="ms-tabbar" aria-label={t('nav.menu')}>
      <ul>
        {MOBILE_TABS.map((tab) => {
          const label = t(tab.labelKey);
          const cls = `ms-tab${tab.raised ? ' ms-tab--raised' : ''}`;
          if (!tab.href) {
            return (
              <li key={tab.id}>
                <button
                  ref={moreButton}
                  type="button"
                  className={cls}
                  aria-haspopup="dialog"
                  aria-expanded={moreOpen}
                  onClick={() => setMoreOpen(true)}
                >
                  <i className={tab.icon} aria-hidden="true"></i>
                  <span>{label}</span>
                </button>
              </li>
            );
          }
          const active = isActive(tab.href, pathname);
          return (
            <li key={tab.id}>
              <Link href={tab.href} className={cls} aria-current={active ? 'page' : undefined}>
                <i className={tab.icon} aria-hidden="true"></i>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <PagesSheet open={moreOpen} onClose={() => setMoreOpen(false)} variant="more" returnFocusRef={moreButton} />
    </nav>
  );
}
