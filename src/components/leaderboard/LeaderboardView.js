"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import SampleDataBadge from "../shared/SampleDataBadge";
import {
  DEMO_CATEGORIES,
  DEMO_LEADERBOARD_UPDATED_AT,
  DEMO_SCOPES,
  demoRowsFor,
} from "../../data/demoLeaderboard";
import "./LeaderboardView.css";

const SCOPE_LABELS = { city: "City", state: "State", country: "Country", global: "Global" };
const CATEGORY_LABELS = {
  overall: "Overall",
  yoga: "Yoga",
  fitness: "Fitness",
  nutrition: "Nutrition",
  sustainability: "Sustainability",
};

/**
 * Leaderboard with functional filters and an honest data story.
 * Real cross-user standings are NOT supported (no durable backend, no
 * public-profile consent). The real board is therefore always an empty
 * state; fictional fixtures render only behind an explicit demo toggle and
 * SampleDataBadge, kept fully separate from real-user state.
 */
export default function LeaderboardView() {
  const [scope, setScope] = useState("city");
  const [category, setCategory] = useState("overall");
  const [showDemo, setShowDemo] = useState(false);

  const demoRows = useMemo(() => demoRowsFor(scope, category), [scope, category]);

  return (
    <div className="lb-wrap">
      <div className="lb-filters" role="group" aria-label="Leaderboard filters">
        <div className="lb-filter-row" role="radiogroup" aria-label="Scope">
          {DEMO_SCOPES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={scope === s}
              className={scope === s ? "lb-chip lb-chip-on" : "lb-chip"}
              onClick={() => setScope(s)}
            >
              {SCOPE_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="lb-filter-row" role="radiogroup" aria-label="Category">
          {DEMO_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={category === c}
              className={category === c ? "lb-chip lb-chip-on" : "lb-chip"}
              onClick={() => setCategory(c)}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </div>

      <section className="lb-real" aria-label="Public standings">
        <h2>
          Public standings · {SCOPE_LABELS[scope]} · {CATEGORY_LABELS[category]}
        </h2>
        <div className="lb-empty" role="status">
          <p>
            <strong>No public standings yet.</strong>
          </p>
          <p>
            Real rankings need a durable backend, voluntary public-profile consent with coarse
            location only, and anti-gaming safeguards. Until then this board stays empty rather
            than inventing ranks. No GPS, medical, or private data is collected for rankings.
          </p>
          <p>
            <Link href="/profile">Build your local streak on your Profile →</Link>
          </p>
        </div>
      </section>

      <section className="lb-demo" aria-label="Demo preview">
        <div className="lb-demo-head">
          <h2>
            Demo preview <SampleDataBadge />
          </h2>
          <button
            type="button"
            onClick={() => setShowDemo((v) => !v)}
            aria-expanded={showDemo}
            className="lb-demo-toggle"
          >
            {showDemo ? "Hide fictional demo" : "Show fictional demo"}
          </button>
        </div>
        {showDemo ? (
          <div>
            <p className="lb-demo-note">
              Fictional users for UI preview only (updated {DEMO_LEADERBOARD_UPDATED_AT}). Not real
              people, not your data, not rankings.
            </p>
            <table className="lb-table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Name (fictional)</th>
                  <th scope="col">Area (coarse)</th>
                  <th scope="col">Points (demo)</th>
                  <th scope="col">Active days (demo)</th>
                </tr>
              </thead>
              <tbody>
                {demoRows.map((r) => (
                  <tr key={`${r.displayName}-${r.rank}`}>
                    <td>{r.rank}</td>
                    <td>{r.displayName}</td>
                    <td>{r.scopeLabel}</td>
                    <td>{r.points}</td>
                    <td>{r.activeDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="lb-demo-note">Demo hidden. The public board above remains the source of truth.</p>
        )}
      </section>
    </div>
  );
}
