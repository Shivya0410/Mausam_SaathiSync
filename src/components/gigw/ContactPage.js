"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import ContentPage from './ContentPage';
import ExternalLink from '../shared/ExternalLink';
import { SITE } from '../../config/site';

/** Contact us (GIGW G11, PRD 15.3, 15.5 grievance). */
export default function ContactPage() {
  const { t } = useTranslation();
  return (
    <ContentPage page="contact">
      <section className="ms-card ms-article" aria-labelledby="ct-team">
        <h2 id="ct-team">{t('gigw.contact.team.title')}</h2>
        <p>{t('footer.ownership')}</p>
        {SITE.contactEmail ? (
          <p>{t('gigw.contact.email')}: <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a></p>
        ) : (
          <p>{t('gigw.contact.useFeedback')} <Link href="/feedback">{t('footer.feedback')}</Link></p>
        )}
        {SITE.repoUrl ? <p><ExternalLink href={SITE.repoUrl}>{t('gigw.contact.source')}</ExternalLink></p> : null}
      </section>
      <section className="ms-card ms-article" aria-labelledby="ct-imd">
        <h2 id="ct-imd">{t('gigw.contact.official.title')}</h2>
        <p>{t('gigw.contact.official.body')}</p>
        <p><ExternalLink href="https://mausam.imd.gov.in/responsive/contactus.php">{t('gigw.contact.official.link')}</ExternalLink></p>
      </section>
      <section className="ms-card ms-article" aria-labelledby="ct-grievance">
        <h2 id="ct-grievance">{t('gigw.contact.grievance.title')}</h2>
        <p>{t('gigw.contact.grievance.body')}</p>
        <p className="ms-muted">{t('gigw.contact.grievance.production')}</p>
      </section>
    </ContentPage>
  );
}
