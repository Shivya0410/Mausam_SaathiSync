"use client";

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS, isActive } from '../../config/navItems';
import PagesSheet from '../layout/PagesSheet';
import './navbar.css';

// Desktop and tablet sidebar (PRD section 4.2). Hidden below 768 px, where
// BottomTabBar takes over; the two are never shown together.
export default function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [panelOpen, setPanelOpen] = useState(false);
  const panelButton = useRef(null);

  return (
    <nav className="main-menu" aria-label={t('nav.menu')}>
      <ul>
        {NAV_ITEMS.map((item) => {
          const label = t(item.labelKey);
          if (!item.href) {
            return (
              <li key={item.id} className="nav-item">
                <button
                  ref={panelButton}
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={panelOpen}
                  onClick={() => setPanelOpen(true)}
                >
                  <i className={item.icon} aria-hidden="true"></i>
                  <span className="nav-text">{label}</span>
                </button>
              </li>
            );
          }
          const active = isActive(item.href, pathname);
          return (
            <li key={item.id} className={`nav-item ${active ? 'active' : ''}`}>
              <Link href={item.href} aria-current={active ? 'page' : undefined}>
                <i className={item.icon} aria-hidden="true"></i>
                <span className="nav-text">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <PagesSheet
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        variant="myPages"
       
      />
    </nav>
  );
}
