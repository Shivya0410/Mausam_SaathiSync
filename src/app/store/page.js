"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import WithNavbar from "../../components/layout/WithNavbar";
import StoreHero from "../../components/store/StoreHero";
import PromoBanner from "../../components/store/PromoBanner";
import ProductCategories from "../../components/store/ProductCategories";
import FeaturedProducts from "../../components/store/FeaturedProducts";
import CuratedRecommendations from "../../components/store/CuratedRecommendations";
import { PRODUCTS } from "../../data/products";
import "../../components/challenges/Challenges.css";
import "../../components/store/Store.css";

export default function StorePage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");

  // Local filtering: category + search across name/brand (no backend search).
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (q && !`${p.name} ${p.brand}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, cat]);

  return (
    <WithNavbar>
      <div className="store-page">
        <StoreHero query={query} onQuery={setQuery} />
        <PromoBanner />
        <ProductCategories value={cat} onChange={setCat} />
        <section aria-label={t("store.browseTitle")}>
          <FeaturedProducts products={results} />
        </section>
        <CuratedRecommendations />
      </div>
    </WithNavbar>
  );
}
