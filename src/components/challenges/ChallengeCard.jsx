"use client";

import { useTranslation } from "react-i18next";
import { CATEGORY_META, daysRemaining, formatParticipants } from "../../data/challenges";

/** One challenge card: CSS-art cover, meta, Join → Joined ✓. */
export default function ChallengeCard({ challenge, joined, onJoin }) {
  const { t } = useTranslation();
  const meta = CATEGORY_META[challenge.category];
  const left = daysRemaining(challenge);
  return (
    <article className="chal-card">
      <div className="chal-cover" style={{ background: `linear-gradient(135deg, ${meta.color}, #493971)` }}>
        <span className="chal-cover-art" aria-hidden="true">
          <i className={meta.icon}></i>
        </span>
        <span className="chal-cat">{t(meta.labelKey)}</span>
      </div>
      <div className="chal-body">
        <h3>{challenge.title}</h3>
        <p>{challenge.description}</p>
        <div className="chal-meta">
          <span><i className="fa-regular fa-calendar" aria-hidden="true"></i>{t("chal.daysLeft", { n: left })}</span>
          <span><i className="fa-solid fa-users" aria-hidden="true"></i>{formatParticipants(challenge.participants + (joined ? 1 : 0))}</span>
        </div>
        <span className="chal-xp">+{challenge.xp} XP</span>
        <button
          type="button"
          className={`chal-join ${joined ? "chal-joined" : ""}`}
          onClick={onJoin}
          disabled={joined}
          aria-pressed={joined}
        >
          {joined ? t("chal.joined") : t("chal.join")}
        </button>
      </div>
    </article>
  );
}
