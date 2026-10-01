"use client";

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import ContentPage from './ContentPage';
import { SITE_TREE } from '../../config/sitemap';

function Tree({ nodes }) {
  const { t } = useTranslation();
  return (
    <ul className="ms-sitemap">
      {nodes.map((n) => (
        <li key={n.href || n.labelKey}>
          {n.href ? <Link href={n.href}>{t(n.labelKey)}</Link> : <span>{t(n.labelKey)}</span>}
          {n.children ? <Tree nodes={n.children} /> : null}
        </li>
      ))}
    </ul>
  );
}

/** Human-readable sitemap (GIGW G8, PRD 4.3). */
export default function SitemapPage() {
  return (
    <ContentPage page="sitemap">
      <nav className="ms-card" aria-label="Sitemap">
        <Tree nodes={SITE_TREE} />
      </nav>
    </ContentPage>
  );
}
