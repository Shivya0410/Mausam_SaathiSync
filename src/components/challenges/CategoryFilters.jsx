"use client";

import { useTranslation } from "react-i18next";
import { CATEGORY_META } from "../../data/challenges";

/** Category chips; `value` is "all" or a category id. Filtering really filters. */
export default function CategoryFilters({ value, onChange }) {
  const { t } = useTranslation();
  const cats = ["all", "steps", "workout", "yoga", "nutrition"];
  return (
    <div className="chal-filters" role="group" aria-label={t("chal.filterLabel")}>
      {cats.map((c) => (
        <button
          key={c}
          type="button"
          aria-pressed={value === c}
          className={`chal-chip ${value === c ? "chal-chip-on" : ""}`}
          onClick={() => onChange(c)}
        >
          {c !== "all" && <i className={CATEGORY_META[c].icon} aria-hidden="true"></i>}
          {c === "all" ? t("chal.catAll") : t(CATEGORY_META[c].labelKey)}
        </button>
      ))}
    </div>
  );
}
