"use client";

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS } from '../../config/navItems';
import { PERSONAS } from '../../config/personas';

// One link per persona page; coast and fisher share /coast.
const PERSONA_PAGES = PERSONAS.filter((p) => p.page && p.tile);

/**
 * "My pages" panel (sidebar) and "More" sheet (mobile). A modal dialog:
 * focus moves in on open, Escape closes, focus returns to the opener.
 * Part 2 narrows "My pages" to the personas the user chose.
 */
export default function PagesSheet({ open, onClose, variant, returnFocusRef }) {
  const { t } = useTranslation();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const returnTo = returnFocusRef?.current;
    panelRef.current?.querySelector('a, button')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && panelRef.current) {
        const items = panelRef.current.querySelectorAll('a, button');
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      returnTo?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!open) return null;
  const title = variant === 'more' ? t('nav.more') : t('nav.myDay');

  return (
    <div className="ms-sheet-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="ms-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ms-sheet-head">
          <h2>{title}</h2>
          <button type="button" className="ms-icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <ul className="ms-sheet-list">
          {PERSONA_PAGES.map((p) => (
            <li key={p.id}>
              <Link href={p.page} onClick={onClose}>
                <i className={p.icon} aria-hidden="true"></i> {t(p.nameKey)}
              </Link>
            </li>
          ))}
        </ul>
        {variant === 'more' ? (
          <>
            <h3 className="ms-sheet-sub">{t('nav.allPages')}</h3>
            <ul className="ms-sheet-list">
              {NAV_ITEMS.filter((i) => i.href).map((i) => (
                <li key={i.id}>
                  <Link href={i.href} onClick={onClose}>
                    <i className={i.icon} aria-hidden="true"></i> {t(i.labelKey)}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/sitemap" onClick={onClose}>
                  <i className="fa-solid fa-sitemap" aria-hidden="true"></i> {t('footer.sitemap')}
                </Link>
              </li>
            </ul>
          </>
        ) : null}
      </div>
    </div>
  );
}
