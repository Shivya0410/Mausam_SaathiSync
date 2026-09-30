"use client";

import { useTranslation } from "react-i18next";
import PageHeader from "../layout/PageHeader";
import "../challenges/Challenges.css";

/** Hero: shared header look + CTA that scrolls to the challenge list. */
export default function ChallengesHero() {
  const { t } = useTranslation();
  const scroll = () => {
    document.getElementById("challenges-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <div>
      <PageHeader title={t("chal.heroTitle")} subtitle={t("chal.heroSub")} />
      <button type="button" className="chal-hero-cta" onClick={scroll}>
        {t("chal.explore")} ↓
      </button>
    </div>
  );
}
