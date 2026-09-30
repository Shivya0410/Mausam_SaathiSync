"use client";

import { useTranslation } from "react-i18next";
import { CATEGORY_META, formatParticipants } from "../../data/challenges";

/** Big featured card with stats, progress (when joined) and Start button. */
export default function FeaturedChallenge({ challenge, joined, joinedAt, onJoin }) {
  const { t } = useTranslation();
  const meta = CATEGORY_META[challenge.category];
  const elapsed = joinedAt
    ? Math.min(Math.floor((Date.now() - new Date(joinedAt).getTime()) / 86400000), challenge.durationDays)
    : 0;
  const progress = joined ? Math.max(elapsed / challenge.durationDays, 0.03) : 0;
  return (
    <article className="chal-featured">
      <div className="chal-featured-cover" style={{ background: `linear-gradient(135deg, ${meta.color}, #2d1b4e)` }}>
        <span className="chal-featured-art" aria-hidden="true">
          <i className={meta.icon}></i>
        </span>
        <span className="chal-cat">{t("chal.featuredTag")}</span>
      </div>
      <div className="chal-featured-body">
        <h2>{challenge.title}</h2>
        <p>{challenge.description}</p>
        <div className="chal-fstats">
          <div><strong>{challenge.durationDays}</strong><small>{t("chal.duration")}</small></div>
          <div><strong>{formatParticipants(challenge.participants + (joined ? 1 : 0))}</strong><small>{t("chal.participants")}</small></div>
          <div><strong>+{challenge.xp} XP</strong><small>{t("chal.reward")}</small></div>
        </div>
        {joined && (
          <div className="chal-progress" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={t("chal.progressLabel")}>
            <span style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        )}
        <button
          type="button"
          className={`chal-join ${joined ? "chal-joined" : ""}`}
          onClick={onJoin}
          disabled={joined}
          aria-pressed={joined}
          style={{ maxWidth: 260 }}
        >
          {joined ? t("chal.joined") : t("chal.start")}
        </button>
      </div>
    </article>
  );
}
