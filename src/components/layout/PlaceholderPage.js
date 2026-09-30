"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PageHeader from './PageHeader';
import ExternalLink from '../shared/ExternalLink';

/**
 * Interim content for a route that is planned but not built yet (build plan
 * Parts 2 and 3). It says so plainly and points to pages that work.
 */
export default function PlaceholderPage({ pageKey }) {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t(`pages.${pageKey}.title`)} subtitle={t(`pages.${pageKey}.subtitle`)} />
      <section className="ms-card ms-placeholder" aria-labelledby="placeholder-title">
        <h2 id="placeholder-title">{t('placeholder.title')}</h2>
        <p>{t('placeholder.body')}</p>
        <p className="ms-actions">
          <ExternalLink href="https://mausam.imd.gov.in" className="ms-btn ms-btn--secondary">
            {t('placeholder.imdLink')}
          </ExternalLink>
          <Link href="/" className="ms-btn">
            {t('common.goHome')}
          </Link>
        </p>
      </section>
    </>
  );
}
