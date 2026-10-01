"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import ContentPage from './ContentPage';

/** Shown by the service worker when there is no network and no cache (PRD 13.7). */
export default function OfflinePage() {
  const { t } = useTranslation();
  return (
    <ContentPage page="offline" ids={['what']}>
      <section className="ms-card">
        <p className="ms-actions">
          <Link href="/" className="ms-btn">{t('common.goHome')}</Link>
          <a href="tel:112" className="ms-btn ms-btn--danger"><i className="fa-solid fa-phone" aria-hidden="true"></i> 112</a>
        </p>
      </section>
    </ContentPage>
  );
}
