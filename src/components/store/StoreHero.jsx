"use client";

import { useTranslation } from "react-i18next";
import PageHeader from "../layout/PageHeader";
import "../store/Store.css";

/** Store hero: shared header look + local search bar. */
export default function StoreHero({ query, onQuery }) {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("store.heroTitle")} subtitle={t("store.heroSub")} />
      <div className="store-search" role="search">
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={t("store.searchPh")}
          aria-label={t("store.searchPh")}
        />
      </div>
    </div>
  );
}
