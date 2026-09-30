"use client";

import { useTranslation } from "react-i18next";
import { BADGE_DEFS, getBadgeRecords, levelFor } from "../../utils/badges";

function formatEarnedAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
import "./Badges.css";

/** Profile/showcase grid: earned badges in color, locked ones greyed. */
export default function BadgesGrid({ user, fresh = [] }) {
  const { t } = useTranslation();
  const records = getBadgeRecords(user);
  const owned = new Set(records.map((r) => r.id));
  const earnedAtById = new Map(records.map((r) => [r.id, r.earnedAt]));
  const freshSet = new Set(fresh);
  const earnedCount = [...owned].filter((id) => BADGE_DEFS[id]).length;
  const total = Object.keys(BADGE_DEFS).length;
  const level = levelFor(earnedCount);

  return (
    <div className="badges-block">
      <div className="badges-head">
        <h3>
          <i className="fa-solid fa-trophy"></i> {t("badges.title")}
        </h3>
        <span className={`badges-level badges-level-${level}`}>
          {t(`badges.level_${level}`)}
        </span>
      </div>
      <p className="badges-progress" role="status">
        {earnedCount} of {total} earned · {total - earnedCount} locked · this browser only
      </p>
      {fresh.length > 0 && (
        <div className="badges-toast" role="status">
          🎉 {t("badges.newUnlocked")}:{" "}
          {fresh.map((id) => t(BADGE_DEFS[id]?.nameKey || "")).join(", ")}
        </div>
      )}
      <div className="badges-grid">
        {Object.entries(BADGE_DEFS).map(([id, def]) => {
          const has = owned.has(id);
          return (
            <details
              key={id}
              className={`badge-card ${has ? "badge-earned" : "badge-locked"} ${freshSet.has(id) ? "badge-fresh" : ""}`}
            >
              <summary aria-label={`${t(def.nameKey)} — ${has ? "earned" : "locked"}. Activate for details.`}>
                <span className="badge-icon" style={has ? { background: def.color } : undefined}>
                  <i className={has ? def.icon : "fa-solid fa-lock"} aria-hidden="true"></i>
                </span>
                <strong>{t(def.nameKey)}</strong>
                <small>{has ? t(def.descKey) : "Locked"}</small>
              </summary>
              <div className="badge-detail">
                <p>{t(def.descKey)}</p>
                {def.requirement && (
                  <p>
                    <strong>How to earn:</strong> {def.requirement}
                  </p>
                )}
                {has ? (
                  (() => {
                    const when = formatEarnedAt(earnedAtById.get(id));
                    return <p>{when ? `Earned ${when} · this browser.` : "Previously earned · exact date unavailable · this browser."}</p>;
                  })()
                ) : (
                  <p>Not yet earned in this browser.</p>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
