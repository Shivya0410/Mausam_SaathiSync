"use client";

import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Modal dialog / bottom sheet (PRD 20.12 pattern): focus moves in on open,
 * Tab is trapped, Escape and the backdrop close it, and focus returns to
 * whatever opened it.
 */
export default function Dialog({ open, onClose, title, children, className = '', labelledBy }) {
  const { t } = useTranslation();
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const returnTo = document.activeElement;
    const focusables = () =>
      panel.current?.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])') || [];
    (focusables()[1] || focusables()[0])?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab') {
        const items = focusables();
        if (!items.length) return;
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
      if (returnTo && typeof returnTo.focus === 'function') returnTo.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="ms-sheet-backdrop" onClick={onClose}>
      <div
        ref={panel}
        className={`ms-sheet ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={labelledBy ? undefined : title}
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ms-sheet-head">
          <h2 id={labelledBy}>{title}</h2>
          <button type="button" className="ms-icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
