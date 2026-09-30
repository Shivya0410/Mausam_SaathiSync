"use client";

import { useTranslation } from "react-i18next";
import { topRated } from "../../data/products";
import ProductCard from "./ProductCard";

/** "Recommended for your wellness journey" — top-rated picks. */
export default function CuratedRecommendations() {
  const { t } = useTranslation();
  const picks = topRated(4);
  return (
    <section className="store-section" aria-label={t("store.curatedTitle")}>
      <h2>{t("store.curatedTitle")}</h2>
      <p>{t("store.curatedSub")}</p>
      <div className="store-grid">
        {picks.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
