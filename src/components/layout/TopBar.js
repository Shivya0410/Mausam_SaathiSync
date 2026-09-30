"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../config/site';
import { useLanguage } from '../../lib/i18n/useLanguage';

/**
 * Top bar (PRD section 5.3). Part 1 ships the skeleton: brand and the
 * language selector (GIGW G1: a visible language switch on every page).
 * Part 2 adds the place switcher, accessibility tools, alerts bell and the
 * offline and lite-mode chips.
 */
export default function TopBar() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <header role="banner" className="ms-topbar">
      <Link href="/" className="ms-brand" aria-label={t('topbar.homeLink')}>
        <span className="ms-brand-mark" aria-hidden="true">
          <i className="fa-solid fa-cloud-sun"></i>
        </span>
        <span className="ms-brand-name">{t('common.appName')}</span>
      </Link>
      <div className="ms-topbar-tools">
        <label className="ms-lang">
          <span className="visually-hidden">{t('topbar.language')}</span>
          <i className="fa-solid fa-language" aria-hidden="true"></i>
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} lang={l.htmlLang}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
