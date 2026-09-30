"use client";

import { useTranslation } from "react-i18next";
import ProductCard from "./ProductCard";

/** Filtered product grid (category + search already applied by caller). */
export default function FeaturedProducts({ products }) {
  const { t } = useTranslation();
  if (!products.length) {
    return <p className="store-empty">{t("store.noResults")}</p>;
  }
  return (
    <div className="store-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
