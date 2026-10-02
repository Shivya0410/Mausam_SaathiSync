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

  const farmCount = useMemo(() => fullList.filter((s) => s.category === "farm").length, [fullList]);
  const safetyCount = useMemo(() => fullList.filter((s) => s.category === "safety").length, [fullList]);
  const portalCount = useMemo(() => fullList.filter((s) => ["app", "portal", "health", "coast"].includes(s.category)).length, [fullList]);

  const filteredList = useMemo(() => {
    if (filter === "farm") return fullList.filter((s) => s.category === "farm");
    if (filter === "safety") return fullList.filter((s) => s.category === "safety");
    if (filter === "portal") return fullList.filter((s) => ["app", "portal", "health", "coast"].includes(s.category));
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
          <div className="gov-emblem-badge" aria-hidden="true">
            <i className="fa-solid fa-landmark-flag"></i>
          </div>
          <div>
            <h2 id="gov-title">{t("gov.title")}</h2>
            <p>{t("gov.subtitle")}</p>
          </div>
        </div>
        <div className="gov-badge-group">
          <span className="gov-verified-chip">
            <span className="gov-pulse-dot" aria-hidden="true"></span>
            <i className="fa-solid fa-shield-halved" aria-hidden="true"></i> Verified Official Portals
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="gov-filter-tabs" role="tablist" aria-label="Filter government services">
        <button
          type="button"
          role="tab"
          aria-selected={filter === "all"}
          className={`gov-tab-btn ${filter === "all" ? "is-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          <i className="fa-solid fa-layer-group" aria-hidden="true"></i>
          <span>All Portals</span>
          <span className="gov-tab-count">{fullList.length}</span>
        </button>
        {farmCount > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={filter === "farm"}
            className={`gov-tab-btn ${filter === "farm" ? "is-active" : ""}`}
            onClick={() => setFilter("farm")}
          >
            <i className="fa-solid fa-wheat-awn" aria-hidden="true"></i>
            <span>Farmers & Mandi</span>
            <span className="gov-tab-count">{farmCount}</span>
          </button>
        )}
        {safetyCount > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={filter === "safety"}
            className={`gov-tab-btn ${filter === "safety" ? "is-active" : ""}`}
            onClick={() => setFilter("safety")}
          >
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>
            <span>Disaster & Safety</span>
            <span className="gov-tab-count">{safetyCount}</span>
          </button>
        )}
        {portalCount > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={filter === "portal"}
            className={`gov-tab-btn ${filter === "portal" ? "is-active" : ""}`}
            onClick={() => setFilter("portal")}
          >
            <i className="fa-solid fa-tower-broadcast" aria-hidden="true"></i>
            <span>Weather & Public Portals</span>
            <span className="gov-tab-count">{portalCount}</span>
          </button>
        )}
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
                <span className="gov-owner-tag">
                  <i className="fa-solid fa-circle-check gov-check-icon" aria-hidden="true"></i>
                  {s.owner || "Govt. of India"}
                </span>
                <span className={`gov-type-badge gov-type-badge--${s.theme || "purple"}`}>
                  {s.type || "Portal"}
                </span>
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
                  <span>{s.type?.includes("App") ? "Open App" : t("gov.visit")}</span>
                  <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
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
