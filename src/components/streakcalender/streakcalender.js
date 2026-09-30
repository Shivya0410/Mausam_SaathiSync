"use client";

import React, { useMemo } from "react";
import "./streak.css";

/**
 * Renders a month grid, highlighting the days present in `streakData`.
 *
 * The grid is derived from the props rather than copied into state by an
 * effect. The previous version stored it with setState inside useEffect, which
 * meant the first paint of every month was an empty grid: the effect only runs
 * after that paint. Changing month therefore flashed blank before filling in.
 */
const StreakCalendar = ({ streakData = [], year, month }) => {
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDay = new Date(year, month - 1, 1).getDay();

    // Leading blanks so the first of the month lands on the right weekday.
    const leading = Array.from({ length: startDay }, () => null);

    const days = Array.from({ length: daysInMonth }, (_, index) => {
      const dayOfMonth = index + 1;
      return {
        day: dayOfMonth,
        date: [
          year,
          String(month).padStart(2, "0"),
          String(dayOfMonth).padStart(2, "0"),
        ].join("-"),
      };
    });

    return [...leading, ...days];
  }, [year, month]);

  // A Set makes the lookup below O(1) per cell rather than scanning the whole
  // streak array for each of the ~31 days.
  const streakDates = useMemo(() => new Set(streakData), [streakData]);

  return (
    <div className="calendar-streak">
      {calendarDays.map((item, index) =>
        item ? (
          <div
            key={item.date}
            className={`day-box ${streakDates.has(item.date) ? "streak-day" : ""}`}
          >
            {item.day}
          </div>
        ) : (
          <div key={`blank-${index}`} className="day-box" aria-hidden="true" />
        )
      )}
    </div>
  );
};

export default StreakCalendar;
