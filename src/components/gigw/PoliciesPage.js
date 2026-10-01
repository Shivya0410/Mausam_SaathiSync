"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import ContentPage, { Sections } from './ContentPage';
import PageHeader from '../layout/PageHeader';
import { POLICY_SLUGS } from '../../config/sitemap';
import { SITE } from '../../config/site';
import { fmtDate } from '../../lib/format';

/** Section ids per policy (text: gigw.policyPages.<slug>.<id>.{title, body[]}). */
export const POLICY_SECTIONS = {
  privacy: ['who', 'what', 'device', 'why', 'howLong', 'rights', 'contact'],
  terms: ['use', 'accuracy', 'conduct', 'changes'],
  copyright: ['main'],
  hyperlinking: ['out', 'in'],
  disclaimer: ['main'],
  archival: ['main'],
  review: ['main'],
  security: ['main'],
};

/** Website policies hub (GIGW G12). */
export function PoliciesHub() {
  const { t } = useTranslation();
  return (
    <ContentPage page="policies">
      <ul className="ms-learn-list">
        {POLICY_SLUGS.map((s) => (
          <li key={s}>
            <Link href={`/policies/${s}`} className="ms-card ms-learn-card">
              <span>
                <strong>{t(`policies.${s}.title`)}</strong>
                <span className="ms-muted">{t(`policies.${s}.summary`)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </ContentPage>
  );
}

/** One policy page. */
export function PolicyPage({ slug }) {
  const { t, i18n } = useTranslation();
  return (
    <>
      <PageHeader title={t(`policies.${slug}.title`)} subtitle={t(`policies.${slug}.summary`)} />
      <Sections page={`policyPages.${slug}`} ids={POLICY_SECTIONS[slug] || []} />
      <p>
        <Link href="/policies">{t('gigw.policies.all')}</Link>
      </p>
      <p className="ms-muted">{t('gigw.lastReviewed', { date: fmtDate(SITE.lastUpdated, i18n.language) })}</p>
    </>
  );
}
