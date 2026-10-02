"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { GOV_SERVICES } from "../../data/govServices";
import "./GovServicesStrip.css";

/**
 * Government weather services (PRD 20.16), adapted from the SaathiSync
 * GovBanner. Official URLs only; services relevant to the user's personas
 * come first with vibrant cards, ministry badges, and category tabs.
 */
export default function GovServicesStrip({ personaIds = [] }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");

  const relevant = (s) => s.personas.includes("all") || s.personas.some((p) => personaIds.includes(p));
  const fullList = useMemo(() => {
    return [...GOV_SERVICES.filter((s) => relevant(s) && s.id !== "indiaPortal")].sort(
      (a, b) => Number(a.personas.includes("all")) - Number(b.personas.includes("all")),
    );
  }, [personaIds]);

  const filteredList = useMemo(() => {
    if (filter === "farm") return fullList.filter((s) => s.category === "farm");
    if (filter === "safety") return fullList.filter((s) => s.category === "safety");
    if (filter === "app") return fullList.filter((s) => ["app", "portal"].includes(s.category));
    return fullList;
  }, [filter, fullList]);

  return (
    <section className="gov-banner" aria-labelledby="gov-title">
      <div className="gov-flag" aria-hidden="true">
        <span className="gov-saffron" />
        <span className="gov-white" />
        <span className="gov-green" />
      </div>

      <div className="gov-head-wrap">
        <div className="gov-head">
          <div className="gov-emblem-badge">
            <i className="fa-solid fa-landmark-flag" aria-hidden="true"></i>
          </div>
          <div>
            <h2 id="gov-title">{t("gov.title")}</h2>
            <p>{t("gov.subtitle")}</p>
          </div>
        </div>
        <span className="gov-verified-chip">
          <i className="fa-solid fa-shield-halved" aria-hidden="true"></i> Verified Govt. Portals
        </span>
      </div>

      {/* Category Pills */}
      <div className="gov-filter-tabs" role="tablist" aria-label="Filter government services">
        <button
          type="button"
          role="tab"
          aria-selected={filter === "all"}
          className={`gov-tab-btn ${filter === "all" ? "is-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          <i className="fa-solid fa-layer-group" aria-hidden="true"></i> All Portals ({fullList.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "farm"}
          className={`gov-tab-btn ${filter === "farm" ? "is-active" : ""}`}
          onClick={() => setFilter("farm")}
        >
          <i className="fa-solid fa-wheat-awn" aria-hidden="true"></i> Farmers & Mandi
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "safety"}
          className={`gov-tab-btn ${filter === "safety" ? "is-active" : ""}`}
          onClick={() => setFilter("safety")}
        >
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Disaster & Safety
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "app"}
          className={`gov-tab-btn ${filter === "app" ? "is-active" : ""}`}
          onClick={() => setFilter("app")}
        >
          <i className="fa-solid fa-mobile-screen-button" aria-hidden="true"></i> Official Apps
        </button>
      </div>

      <ul className="gov-grid">
        {filteredList.map((s) => (
          <li key={s.id}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`gov-card gov-card--${s.theme || "purple"}`}
            >
              <div className="gov-card-top">
                <span className="gov-owner-tag">{s.owner || "Govt. of India"}</span>
                <span className={`gov-type-badge gov-type-badge--${s.theme || "purple"}`}>{s.type || "Portal"}</span>
              </div>

              <div className="gov-card-main">
                <div className={`gov-icon-wrap gov-icon-wrap--${s.theme || "purple"}`}>
                  <i className={s.icon || "fa-solid fa-building-columns"} aria-hidden="true"></i>
                </div>
                <div className="gov-card-info">
                  <strong className="gov-card-name">{t(`gov.services.${s.id}.name`)}</strong>
                  <small className="gov-card-desc">{t(`gov.services.${s.id}.desc`)}</small>
                </div>
              </div>

              <div className="gov-card-foot">
                <span className="gov-go">
                  {s.type?.includes("App") ? "Open App" : t("gov.visit")} <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                  <span className="visually-hidden"> ({t("common.opensNewTab")})</span>
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
