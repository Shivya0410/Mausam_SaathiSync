import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROFILE_CALENDAR_CELLS,
  WEEKDAY_HEADERS,
  chunkIntoWeeks,
  clampWeekIndex,
  columnCount,
  hideWeekendsInWeeks,
  visibleHeaders,
} from '../src/lib/profileCalendar.js';

// The Profile appointment calendar was hardcoded static markup (September
// 2024, fixed appointments). The Week / Month / Weekends controls now slice
// and filter that EXISTING data. These tests pin the transcription (no
// invented or altered records) and the pure view logic. They do not render
// React: behaviour is asserted through the same helpers profile.js uses.

test('calendar transcription preserves all 35 original cells (5 weeks)', () => {
  assert.equal(PROFILE_CALENDAR_CELLS.length, 35);
  const weeks = chunkIntoWeeks(PROFILE_CALENDAR_CELLS);
  assert.equal(weeks.length, 5);
  for (const week of weeks) assert.equal(week.length, 7);
});

test('adjacent-month overflow cells match the original not-work days', () => {
  const weeks = chunkIntoWeeks(PROFILE_CALENDAR_CELLS);
  assert.deepEqual(
    weeks[0][0],
    { day: '31', adjacent: true },
  );
  assert.deepEqual(
    weeks[4].slice(3).map((c) => c.day),
    ['1', '2', '3', '4'],
  );
  assert.ok(weeks[4].slice(3).every((c) => c.adjacent === true));
});

test('all original events are preserved verbatim (no invented records)', () => {
  const events = PROFILE_CALENDAR_CELLS.filter((c) => c.tone);
  assert.equal(events.length, 6);

  const day1 = PROFILE_CALENDAR_CELLS[1];
  assert.equal(day1.day, '1');
  assert.equal(day1.tone, 'project-market');
  assert.equal(day1.hoverTitle, 'Appointment 1');
  assert.deepEqual(
    day1.details.map((d) => d.text),
    ['Appointment with Dr. Neetu', 'Appointment to ask about sports Nutritions'],
  );
  assert.equal(day1.check, true);

  const byDay = new Map(
    PROFILE_CALENDAR_CELLS.filter((c) => !c.adjacent).map((c) => [c.day, c]),
  );
  assert.equal(byDay.get('3').tone, 'project-design');
  assert.deepEqual(byDay.get('3').details, [
    {
      text: 'Create 3 illustrations for blog post about last global fitness event',
      tone: 'design',
    },
  ]);
  assert.equal(byDay.get('7').tone, 'project-develop');
  assert.deepEqual(byDay.get('7').details, [
    { text: 'Take a sustainable step towards environment.', tone: 'develop' },
  ]);
  assert.equal(byDay.get('15').hoverTitle, 'Cycle Marathon');
  assert.equal(byDay.get('17').hoverTitle, 'Half Marathon Noida');
  assert.equal(byDay.get('17').details.length, 2);
  assert.equal(byDay.get('23').tone, 'project-finance');
  assert.equal(byDay.get('23').hoverTitle, 'Period Reminder');

  // Total appointment lines across the original grid.
  const detailCount = events.reduce((n, c) => n + c.details.length, 0);
  assert.equal(detailCount, 8);
  // Check-mark badges on the original grid.
  assert.equal(events.filter((c) => c.check).length, 4);
});

test('month view keeps every cell; week view shows one week', () => {
  const weeks = chunkIntoWeeks(PROFILE_CALENDAR_CELLS);
  const monthCells = weeks.flat().length;
  assert.equal(monthCells, 35);
  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[clampWeekIndex(i, weeks.length)];
    assert.equal(week.length, 7);
  }
});

test('week index clamps to the valid range', () => {
  assert.equal(clampWeekIndex(0, 5), 0);
  assert.equal(clampWeekIndex(4, 5), 4);
  assert.equal(clampWeekIndex(-1, 5), 0);
  assert.equal(clampWeekIndex(99, 5), 4);
  assert.equal(clampWeekIndex(0, 0), 0);
});

test('weekends toggle hides Saturday/Sunday headers and columns', () => {
  assert.deepEqual(visibleHeaders(true), WEEKDAY_HEADERS);
  assert.equal(visibleHeaders(true).length, 7);
  assert.deepEqual(visibleHeaders(false), [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);

  const weeks = chunkIntoWeeks(PROFILE_CALENDAR_CELLS);
  const hidden = hideWeekendsInWeeks(weeks);
  assert.equal(hidden.length, 5);
  for (const week of hidden) assert.equal(week.length, 5);

  // Every original event falls on a weekday column, so hiding weekends
  // drops no appointments — the toggle only changes layout, never data.
  const tonesShown = hidden.flat().filter((c) => c.tone).length;
  const tonesTotal = PROFILE_CALENDAR_CELLS.filter((c) => c.tone).length;
  assert.equal(tonesShown, tonesTotal);

  assert.equal(columnCount(true), 7);
  assert.equal(columnCount(false), 5);
});

test('no cheat-day model is defined (nothing to invent behaviour from)', async () => {
  // The "Cheat Days" button has no handlers, state, data or rules anywhere
  // in the codebase, so the calendar lib deliberately models nothing for it.
  // This test guards that: any future cheat-day data must be added
  // explicitly rather than inferred.
  const cal = await import('../src/lib/profileCalendar.js');
  assert.ok(
    Object.keys(cal).every((key) => !/cheat/i.test(key)),
    'no cheat-related export may be inferred into the calendar model',
  );
  assert.ok(
    PROFILE_CALENDAR_CELLS.every(
      (cell) => !/cheat/i.test(JSON.stringify(cell)),
    ),
    'no cheat-related record may be inferred into the calendar data',
  );
});
