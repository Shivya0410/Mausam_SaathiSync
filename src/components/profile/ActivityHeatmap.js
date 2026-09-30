"use client";

import React, { useMemo, useState } from "react";
import { PILLAR_META } from "../../lib/activityModel";
import "./ActivityHeatmap.css";

const PILLAR_NAMES = {
  Y: "Yoga",
  M: "Meditation",
  E: "Healthy Diet",
  C: "Creative Hub",
};

/**
 * ~12-month activity heatmap from QUALIFYING tracker check-ins only.
 * Y=Yoga, M=Meditation, E=Healthy Diet, C=Creative Hub (see activityModel).
 * Intensity = number of checked pillars that day (0-4). Page visits and
 * logins never count. Empty state when nothing is logged.
 *
 * Day detail: activating a day (click or Enter/Space) shows the recorded
 * qualifying activities for that date — pillar names and categories taken
 * from the existing activity model. Nothing is invented; a day with no
 * check-ins reports exactly that.
 */
export default function ActivityHeatmap({ eventsByDay, months = 12 }) {
  const [selectedDate, setSelectedDate] = useState(null);

  const cells = useMemo(() => {
    const map = eventsByDay instanceof Map ? eventsByDay : new Map();
    const now = new Date();
    const out = [];
    for (let back = months - 1; back >= 0; back--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - back, 1);
      const y = ref.getFullYear();
      const m = ref.getMonth() + 1;
      const daysInMonth = new Date(y, m, 0).getDate();
      const days = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        days.push({ day: d, date: iso, count: map.get(iso)?.count || 0 });
      }
      out.push({
        key: `${y}-${m}`,
        label: ref.toLocaleString("en-US", { month: "long", year: "numeric" }),
        days,
      });
    }
    return out;
  }, [eventsByDay, months]);

  const totalActive = useMemo(() => {
    const map = eventsByDay instanceof Map ? eventsByDay : new Map();
    return map.size;
  }, [eventsByDay]);

  const selectedPillars = useMemo(() => {
    if (!selectedDate) return null;
    const map = eventsByDay instanceof Map ? eventsByDay : new Map();
    const cell = map.get(selectedDate);
    if (!cell) return [];
    return [...cell.pillars].sort();
  }, [eventsByDay, selectedDate]);

  if (totalActive === 0) {
    return (
      <div className="heatmap-empty" role="status">
        <p>
          <strong>No activity logged yet.</strong>
        </p>
        <p>
          Check Yoga, Meditation, Diet, or Creative Hub in the{" "}
          <a href="/tracker">Tracker</a> — only completed check-ins appear here.
          Page visits and logins never count.
        </p>
      </div>
    );
  }

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-legend" aria-hidden="true">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((n) => (
          <span key={n} className={`heatmap-cell heat-${n}`} />
        ))}
        <span>More (pillars/day)</span>
      </div>
      {cells.map((month) => (
        <section key={month.key} aria-label={month.label} className="heatmap-month">
          <h4>{month.label}</h4>
          <div className="heatmap-grid" role="group" aria-label={`${month.label} activity. Activate a day for details.`}>
            {month.days.map((d) => (
              <button
                key={d.date}
                type="button"
                aria-label={`${d.date}: ${d.count} of 4 pillars. Activate for details.`}
                aria-pressed={selectedDate === d.date}
                title={`${d.date}: ${d.count}/4`}
                className={`heatmap-cell heat-${d.count}${selectedDate === d.date ? " heat-selected" : ""}`}
                onClick={() => setSelectedDate((prev) => (prev === d.date ? null : d.date))}
              >
                <span aria-hidden="true">{d.day}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {selectedDate && (
        <div
          className="heatmap-detail"
          role="status"
          aria-live="polite"
          aria-label={`Activity details for ${selectedDate}`}
        >
          <div className="heatmap-detail-head">
            <strong>{selectedDate}</strong>
            <button type="button" onClick={() => setSelectedDate(null)} aria-label="Clear selected day">
              Clear
            </button>
          </div>
          {selectedPillars === null || selectedPillars.length === 0 ? (
            <p>No qualifying check-ins recorded on this date. Only completed Tracker check-ins appear here.</p>
          ) : (
            <ul>
              {selectedPillars.map((code) => (
                <li key={code}>
                  {PILLAR_NAMES[code] || code} · {PILLAR_META[code]?.category || "logged"}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
