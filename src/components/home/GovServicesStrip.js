"use client";

import { useTranslation } from "react-i18next";
import { GOV_SERVICES } from "../../data/govServices";
import "./GovServicesStrip.css";

/**
 * Government weather services (PRD 20.16), adapted from the SaathiSync
 * GovBanner. Official URLs only; services relevant to the user's personas
 * come first. The tricolour strip is a decorative motif (PRD 15.6).
 */
export default function GovServicesStrip({ personaIds = [] }) {
  const { t } = useTranslation();
  const relevant = (s) => s.personas.includes("all") || s.personas.some((p) => personaIds.includes(p));
  const list = [...GOV_SERVICES.filter((s) => relevant(s) && s.id !== "indiaPortal")].sort(
    (a, b) => Number(a.personas.includes("all")) - Number(b.personas.includes("all")),
  );
  return (
    <section className="gov-banner" aria-labelledby="gov-title">
      <div className="gov-flag" aria-hidden="true">
        <span className="gov-saffron" />
        <span className="gov-white" />
        <span className="gov-green" />
      </div>
      <div className="gov-head">
        <h2 id="gov-title">{t("gov.title")}</h2>
        <p>{t("gov.subtitle")}</p>
      </div>
      <ul className="gov-grid">
        {list.map((s) => (
          <li key={s.id}>
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="gov-card">
              <strong>{t(`gov.services.${s.id}.name`)}</strong>
              <small>{t(`gov.services.${s.id}.desc`)}</small>
              <span className="gov-go">
                {t("gov.visit")} <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                <span className="visually-hidden"> ({t("common.opensNewTab")})</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
