"use client";

import { useTranslation } from 'react-i18next';

/**
 * Link to another site (GIGW G15): opens in a new tab, never passes the
 * opener or referrer, and says so to screen readers.
 */
export default function ExternalLink({ href, children, className }) {
  const { t } = useTranslation();
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer">
      {children}
      <i className="fa-solid fa-arrow-up-right-from-square ms-ext-icon" aria-hidden="true"></i>
      <span className="visually-hidden"> ({t('common.opensNewTab')})</span>
    </a>
  );
}
