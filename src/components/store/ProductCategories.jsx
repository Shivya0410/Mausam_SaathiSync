"use client";

import { useTranslation } from "react-i18next";
import { PRODUCT_CATEGORY_META } from "../../data/products";

/** Category chips; `value` is "all" or a category id. */
export default function ProductCategories({ value, onChange }) {
  const { t } = useTranslation();
  const cats = ["all", "accessories", "equipment", "lifestyle", "nutrition"];
  return (
    <div className="store-cats" role="group" aria-label={t("store.catLabel")}>
      {cats.map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={value === c}
          className={`chal-chip ${value === c ? "chal-chip-on" : ""}`}
          onClick={() => onChange(c)}
        >
          {c !== "all" && <i className={PRODUCT_CATEGORY_META[c].icon} aria-hidden="true"></i>}
          {c === "all" ? t("store.catAll") : t(PRODUCT_CATEGORY_META[c].labelKey)}
        </button>
      ))}
    </div>
  );
}
