"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { FOOTER_LINKS } from '../../config/navItems';
import { SITE } from '../../config/site';
import ExternalLink from '../shared/ExternalLink';

/** GIGW footer (PRD sections 4.2 and 15.1: G9 to G14, G24). */
export default function SiteFooter() {
  const { t, i18n } = useTranslation();
  const lastUpdated = new Intl.DateTimeFormat(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${SITE.lastUpdated}T12:00:00+05:30`));

  return (
    <footer role="contentinfo" className="ms-footer">
      <nav aria-label={t('footer.policies')}>
        <ul className="ms-footer-links">
          {FOOTER_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{t(l.labelKey)}</Link>
            </li>
          ))}
          <li>
            <ExternalLink href={SITE.nationalPortal}>{t('footer.nationalPortal')}</ExternalLink>
          </li>
        </ul>
      </nav>
      <p className="ms-footer-note">{t('footer.dataAttribution')}</p>
      <p className="ms-footer-note">
        {t('footer.disclaimerShort')} {t('footer.ownership')}
      </p>
      <p className="ms-footer-note">
        {t('footer.copyright')} · {t('footer.lastUpdated', { date: lastUpdated })}
      </p>
    </footer>
  );
}
