"use client";

import { useTranslation } from 'react-i18next';
import PageHeader from '../layout/PageHeader';
import { SITE } from '../../config/site';
import { fmtDate } from '../../lib/format';

/**
 * Text sections from the locale files: gigw.<page>.<id>.{title, body[], items[]}.
 * Used by the GIGW pages (PRD 15.3) so every word is bilingual.
 */
export function Sections({ page, ids }) {
  const { t } = useTranslation();
  const arr = (k) => {
    const v = t(k, { returnObjects: true });
    return Array.isArray(v) ? v : [];
  };
  return ids.map((id) => (
    <section key={id} className="ms-card ms-article" aria-labelledby={`${page}-${id}`} id={id}>
      <h2 id={`${page}-${id}`}>{t(`gigw.${page}.${id}.title`)}</h2>
      {arr(`gigw.${page}.${id}.body`).map((p) => (
        <p key={p}>{p}</p>
      ))}
      {arr(`gigw.${page}.${id}.items`).length ? (
        <ul className="ms-list">
          {arr(`gigw.${page}.${id}.items`).map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : null}
    </section>
  ));
}

/** Page frame with the "last updated" line (GIGW G13). */
export default function ContentPage({ page, ids = [], children, after }) {
  const { t, i18n } = useTranslation();
  return (
    <>
      <PageHeader title={t(`gigw.${page}.title`)} subtitle={t(`gigw.${page}.subtitle`)} />
      {children}
      <Sections page={page} ids={ids} />
      {after}
      <p className="ms-muted">{t('gigw.lastReviewed', { date: fmtDate(SITE.lastUpdated, i18n.language) })}</p>
    </>
  );
}
