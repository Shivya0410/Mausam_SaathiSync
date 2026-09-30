"use client";

import { useTranslation } from 'react-i18next';

/** First focusable element on every page (WCAG 2.4.1, GIGW G3). */
export default function SkipLink() {
  const { t } = useTranslation();
  return (
    <a href="#main" className="ms-skip-link">
      {t('topbar.skipToMain')}
    </a>
  );
}
