"use client";

import { useTranslation } from "react-i18next";
import ChallengeCard from "./ChallengeCard";

/** "Community Challenges / Based on your fitness goals" + working filter. */
export default function CommunityChallenges({ challenges, filter, onFilter, joinedIds, onJoin }) {
  const { t } = useTranslation();
  const list = filter === "all" ? challenges : challenges.filter((c) => c.category === filter);
  return (
    <section className="chal-section" id="challenges-list" aria-label={t("chal.communityTitle")}>
      <div className="chal-section-head">
        <h2>{t("chal.communityTitle")}</h2>
        <p>{t("chal.communitySub")}</p>
      </div>
      {list.length === 0 ? (
        <p>{t("chal.noResults")}</p>
      ) : (
        <div className="chal-grid">
          {list.map((c) => (
            <ChallengeCard key={c.id} challenge={c} joined={joinedIds.has(c.id)} onJoin={() => onJoin(c.id)} />
          ))}
        </div>
      )}
    </section>
  );
}
