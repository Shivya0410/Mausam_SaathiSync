"use client";

import { useTranslation } from "react-i18next";

/** Orange promo band: FITNESS FAVOURITES / Save up to 60%. */
export default function PromoBanner() {
  const { t } = useTranslation();
  return (
    <div className="store-promo" role="note">
      <div>
        <small>{t("store.promoKicker")}</small>
        <strong>{t("store.promoTitle")}</strong>
      </div>
      <i className="fa-solid fa-tags" aria-hidden="true"></i>
    </div>
  );
}
