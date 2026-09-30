"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

/** 404 body: removed SaathiSync routes land here with useful next steps. */
export default function NotFoundContent() {
  const { t } = useTranslation();
  return (
    <section className="ms-card" aria-labelledby="nf-title">
      <h1 id="nf-title">{t("notFound.title")}</h1>
      <p>{t("notFound.body")}</p>
      <ul className="ms-link-list">
        <li>
          <Link href="/" className="ms-btn">{t("nav.home")}</Link>
        </li>
        <li>
          <Link href="/alerts" className="ms-btn ms-btn--secondary">{t("nav.alerts")}</Link>
        </li>
        <li>
          <Link href="/forecast" className="ms-btn ms-btn--secondary">{t("nav.forecast")}</Link>
        </li>
      </ul>
    </section>
  );
}
