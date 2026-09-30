"use client";

import { useTranslation } from "react-i18next";
import "./GovBanner.css";

// Government fitness missions highlight — India-centric, gov-first.
// Official portals only: Fit India, Khelo India, Ministry of Ayush.
const MISSIONS = [
  {
    id: "fitindia",
    icon: "fa-solid fa-person-running",
    titleKey: "gov.fitIndia",
    descKey: "gov.fitIndiaD",
    href: "https://fitindia.gov.in",
  },
  {
    id: "khelo",
    icon: "fa-solid fa-trophy",
    titleKey: "gov.kheloIndia",
    descKey: "gov.kheloIndiaD",
    href: "https://kheloindia.gov.in",
  },
  {
    id: "ayush",
    icon: "fa-solid fa-spa",
    titleKey: "gov.ayush",
    descKey: "gov.ayushD",
    href: "https://ayush.gov.in",
  },
];

export default function GovBanner() {
  const { t } = useTranslation();
  return (
    <section className="gov-banner" aria-label={t("gov.title")}>
      <div className="gov-flag" aria-hidden="true">
        <span className="gov-saffron" />
        <span className="gov-white" />
        <span className="gov-green" />
      </div>
      <div className="gov-head">
        <h2>{t("gov.title")}</h2>
        <p>{t("gov.subtitle")}</p>
      </div>
      <div className="gov-grid">
        {MISSIONS.map((m) => (
          <a key={m.id} href={m.href} target="_blank" rel="noreferrer" className="gov-card">
            <i className={m.icon} aria-hidden="true"></i>
            <strong>{t(m.titleKey)}</strong>
            <small>{t(m.descKey)}</small>
            <span className="gov-go">{t("gov.visit")} ↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}
