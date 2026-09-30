/**
 * Pure calendar-view helpers for the Profile appointment calendar.
 *
 * SOURCE OF TRUTH for the grid below: src/components/profile/profile.js
 * rendered a hardcoded September 2024 month grid (docs/OPEN-ISSUES.md notes
 * it was left as static markup). The day cells and their events are
 * transcribed here 1:1 — same labels, same tones (CSS classes), same
 * appointment text — so the Week / Month / Weekends controls can slice and
 * filter the EXISTING calendar without inventing or altering any records.
 *
 * No behaviour is defined anywhere in the codebase for the "Cheat Days"
 * button (no handlers, no state, no data, no rules), so this module
 * deliberately models nothing for it.
 */

export const CALENDAR_MONTH_LABEL = "September";
export const CALENDAR_YEAR_LABEL = "2024";

// Monday-first headers, matching the existing grid.
export const WEEKDAY_HEADERS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Indexes (Monday = 0) of the weekend columns.
export const WEEKEND_INDEXES = [5, 6];

/**
 * One entry per day cell in the original month grid, in render order.
 * `adjacent` marks overflow days from the neighbouring months (the
 * `not-work` cells). `tone` is the existing event CSS class. `details`
 * preserves the existing appointment lines verbatim.
 */
export const PROFILE_CALENDAR_CELLS = [
  { day: "31", adjacent: true },
  {
    day: "1",
    tone: "project-market",
    hoverTitle: "Appointment 1",
    details: [
      { text: "Appointment with Dr. Neetu" },
      { text: "Appointment to ask about sports Nutritions" },
    ],
    check: true,
  },
  { day: "2" },
  {
    day: "3",
    tone: "project-design",
    details: [
      {
        text: "Create 3 illustrations for blog post about last global fitness event",
        tone: "design",
      },
    ],
  },
  { day: "4" },
  { day: "5" },
  { day: "6" },
  {
    day: "7",
    tone: "project-develop",
    details: [
      { text: "Take a sustainable step towards environment.", tone: "develop" },
    ],
  },
  { day: "8" },
  { day: "9" },
  { day: "10" },
  { day: "11" },
  { day: "12" },
  { day: "13" },
  { day: "14" },
  {
    day: "15",
    tone: "project-market",
    hoverTitle: "Cycle Marathon",
    details: [{ text: "Need to attend the cycle marathon." }],
    check: true,
  },
  { day: "16" },
  {
    day: "17",
    tone: "project-market",
    hoverTitle: "Half Marathon Noida",
    details: [
      { text: "Create Banners for sustainability" },
      { text: "Increase the score to gain sustain points" },
    ],
    check: true,
  },
  { day: "18" },
  { day: "19" },
  { day: "20" },
  { day: "21" },
  { day: "22" },
  {
    day: "23",
    tone: "project-finance",
    hoverTitle: "Period Reminder",
    details: [
      { text: "Prediction of current month period date.", tone: "finance" },
    ],
    check: true,
  },
  { day: "24" },
  { day: "25" },
  { day: "26" },
  { day: "27" },
  { day: "28" },
  { day: "29" },
  { day: "30" },
  { day: "1", adjacent: true },
  { day: "2", adjacent: true },
  { day: "3", adjacent: true },
  { day: "4", adjacent: true },
];

/** Split the flat cell list into Monday-first weeks of 7. */
export function chunkIntoWeeks(cells) {
  const weeks = [];
  for (let i = 0; i < (cells || []).length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

/** Headers for the current weekend-visibility setting. */
export function visibleHeaders(showWeekends) {
  if (showWeekends) return [...WEEKDAY_HEADERS];
  return WEEKDAY_HEADERS.filter((_, i) => !WEEKEND_INDEXES.includes(i));
}

/**
 * Remove Saturday/Sunday cells from already-chunked weeks. Each input week
 * is Monday-first, so indexes 5 and 6 are the weekend columns.
 */
export function hideWeekendsInWeeks(weeks) {
  return (weeks || []).map((week) =>
    week.filter((_, i) => !WEEKEND_INDEXES.includes(i))
  );
}

/** Grid column count for the current weekend-visibility setting. */
export function columnCount(showWeekends) {
  return showWeekends ? 7 : 5;
}

/** Clamp a week index into the valid range for the given weeks. */
export function clampWeekIndex(index, weekCount) {
  if (!weekCount || weekCount <= 0) return 0;
  if (index < 0) return 0;
  if (index > weekCount - 1) return weekCount - 1;
  return index;
}
