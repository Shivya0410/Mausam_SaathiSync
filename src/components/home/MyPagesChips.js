"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { PERSONAS } from '../../config/personas';

/** "My pages: Health · Commute · Farm" (PRD 4.2 layer 2). */
export default function MyPagesChips({ personaIds }) {
  const { t } = useTranslation();
  const pages = [];
  for (const id of personaIds) {
    const p = PERSONAS.find((x) => x.id === id);
    if (p?.page && !pages.some((x) => x.page === p.page)) pages.push(p);
  }
  return (
    <nav className="ms-mypages" aria-label={t('home.myPages')}>
      <span className="ms-mypages-label">{t('home.myPages')}</span>
      <ul>
        {pages.map((p) => (
          <li key={p.id}>
            <Link href={p.page} className="ms-chip ms-chip--link">
              <i className={p.icon} aria-hidden="true"></i> {t(p.nameKey)}
            </Link>
          </li>
        ))}
        <li>
          <Link href="/settings#personas" className="ms-chip ms-chip--link">
            <i className="fa-solid fa-plus" aria-hidden="true"></i> {t('home.addPage')}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
