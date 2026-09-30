import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PILLAR_CODES,
  isRealCalendarDate,
  localTodayISO,
  trackerStoreToEvents,
  aggregateByDay,
  summarizeEvents,
  streakEndingAtLatest,
  longestStreak,
  weekStartMonday,
  isDateInWeek,
  toISODate,
} from '../src/lib/activityModel.js';

import { XP_POLICY, XP_POLICY_VERSION, XP_LEVELS, xpForDay, xpLevelFor, xpPreviewForEvents } from '../src/config/xpPolicy.js';

import {
  GOAL_STORE_KEY,
  createGoal,
  goalProgress,
  updateGoalInList,
  validateGoalInput,
} from '../src/lib/weeklyGoalsModel.js';

import { getBadgeRecords, getBadges, awardBadges } from '../src/utils/badges.js';
import { saveForUser, loadForUser, userKey } from '../src/utils/userScopedStorage.js';

// Minimal browser storage mock so per-user browser stores can be exercised in
// node. Installed once; keys are namespaced per account by the utilities.
const __store = new Map();
globalThis.localStorage = {
  getItem: (k) => (__store.has(k) ? __store.get(k) : null),
  setItem: (k, v) => __store.set(k, String(v)),
  removeItem: (k) => __store.delete(k),
  clear: () => __store.clear(),
  get length() {
    return __store.size;
  },
  key: (i) => [...__store.keys()][i] ?? null,
};

test('pillar codes are exactly Y/M/E/C (tracker checkbox codes)', () => {
  assert.deepEqual(PILLAR_CODES, ['Y', 'M', 'E', 'C']);
});

test('only checked boxes count; page visits and logins never qualify', () => {
  const store = {
    '2026-9': {
      14: { Y: true, M: true, E: false },
      15: { Y: true },
    },
  };
  const events = trackerStoreToEvents(store, '2026-09-20');
  assert.deepEqual(events, [
    { date: '2026-09-14', pillar: 'M' },
    { date: '2026-09-14', pillar: 'Y' },
    { date: '2026-09-15', pillar: 'Y' },
  ]);
  // Unchecked/false values produce no events.
  assert.equal(events.filter((e) => e.pillar === 'E').length, 0);
});

test('future dates are dropped and invalid dates rejected', () => {
  assert.equal(isRealCalendarDate('2026-02-30'), false);
  assert.equal(isRealCalendarDate('not-a-date'), false);
  assert.equal(toISODate(2026, 2, 30), null);
  const store = { '2026-9': { 30: { Y: true } } };
  const events = trackerStoreToEvents(store, '2026-09-14');
  assert.equal(events.length, 0);
});

test('summary counts active/perfect days and streaks from qualifying events', () => {
  const events = [
    { date: '2026-09-10', pillar: 'Y' },
    { date: '2026-09-11', pillar: 'Y' },
    { date: '2026-09-11', pillar: 'M' },
    { date: '2026-09-11', pillar: 'E' },
    { date: '2026-09-11', pillar: 'C' },
    { date: '2026-09-13', pillar: 'Y' },
  ];
  const s = summarizeEvents(events);
  assert.equal(s.activeDays, 3);
  assert.equal(s.perfectDays, 1);
  assert.equal(s.totalChecks, 6);
  assert.deepEqual(s.perPillar, { Y: 3, M: 1, E: 1, C: 1 });
  assert.equal(s.bestDay, '2026-09-11');
  // 13 breaks the run: current streak is 1, longest is 2.
  assert.equal(s.currentStreak, 1);
  assert.equal(s.longestStreak, 2);
});

test('streak helpers handle gaps and duplicates', () => {
  assert.equal(streakEndingAtLatest([]), 0);
  assert.equal(streakEndingAtLatest(['2026-09-14', '2026-09-14', '2026-09-13']), 2);
  assert.equal(longestStreak(['2026-09-01', '2026-09-03', '2026-09-04']), 2);
});

test('aggregateByDay caps at distinct pillars per day', () => {
  const byDay = aggregateByDay([
    { date: '2026-09-14', pillar: 'Y' },
    { date: '2026-09-14', pillar: 'Y' },
    { date: '2026-09-14', pillar: 'bogus' },
  ]);
  assert.equal(byDay.get('2026-09-14').count, 1);
});

test('week helpers bucket goals deterministically', () => {
  // 2026-09-14 is a Monday.
  assert.equal(weekStartMonday('2026-09-16'), '2026-09-14');
  assert.equal(isDateInWeek('2026-09-20', '2026-09-14'), true);
  assert.equal(isDateInWeek('2026-09-21', '2026-09-14'), false);
  assert.equal(localTodayISO(new Date(2026, 8, 14)).slice(0, 7), '2026-09');
});

test('XP policy is versioned with per-day caps (local preview)', () => {
  assert.equal(XP_POLICY_VERSION, 2);
  assert.equal(XP_POLICY.version, XP_POLICY_VERSION);
  assert.equal(xpForDay(['Y', 'M', 'E', 'C']), 50);
  assert.equal(xpForDay(['Y', 'Y', 'M']), 20);
  const preview = xpPreviewForEvents([
    { date: '2026-09-14', pillar: 'Y' },
    { date: '2026-09-14', pillar: 'M' },
    { date: '2026-09-14', pillar: 'E' },
    { date: '2026-09-14', pillar: 'C' },
  ]);
  assert.equal(preview.total, 50);
  assert.equal(preview.policyVersion, XP_POLICY_VERSION);
  assert.equal(preview.daysCounted, 1);
});

test('weekly cap follows Monday–Sunday weeks, including Sunday/Monday transitions', () => {
  // 2026-09-14 is a Monday, so 2026-09-13 (Sun) and 2026-09-14 (Mon) fall in
  // different weeks. A small weekly cap makes the boundary observable.
  const policy = { ...XP_POLICY, caps: { ...XP_POLICY.caps, maxPointsPerWeek: 60 } };
  const perfect = (date) => [
    { date, pillar: 'Y' },
    { date, pillar: 'M' },
    { date, pillar: 'E' },
    { date, pillar: 'C' },
  ];
  const acrossWeeks = xpPreviewForEvents([...perfect('2026-09-13'), ...perfect('2026-09-14')], policy);
  assert.equal(acrossWeeks.total, 100);
  const sameWeek = xpPreviewForEvents([...perfect('2026-09-14'), ...perfect('2026-09-15')], policy);
  assert.equal(sameWeek.total, 60);
  // A full perfect week (Mon 14 – Sun 20) reaches exactly the default cap.
  const week = [];
  for (let d = 14; d <= 20; d++) week.push(...perfect(`2026-09-${d}`));
  assert.equal(xpPreviewForEvents(week).total, 350);
});

test('duplicate events cannot award XP more than once', () => {
  const dup = [
    { date: '2026-09-14', pillar: 'Y' },
    { date: '2026-09-14', pillar: 'Y' },
    { date: '2026-09-14', pillar: 'M' },
    { date: '2026-09-14', pillar: 'M' },
  ];
  assert.equal(xpPreviewForEvents(dup).total, 20);
  const byDay = aggregateByDay(dup);
  assert.equal(byDay.get('2026-09-14').count, 2);
});

test('heatmap day detail exposes only recorded qualifying pillars', () => {
  const byDay = aggregateByDay([
    { date: '2026-09-14', pillar: 'Y' },
    { date: '2026-09-14', pillar: 'M' },
  ]);
  assert.deepEqual([...byDay.get('2026-09-14').pillars].sort(), ['M', 'Y']);
  assert.equal(byDay.has('2026-09-15'), false);
});

test('weekly goals validate, edit in place, and never duplicate', () => {
  assert.equal(validateGoalInput({ pillar: 'Y', target: 3 }, 0), '');
  assert.ok(validateGoalInput({ pillar: 'Z', target: 3 }, 0).length > 0);
  assert.ok(validateGoalInput({ pillar: 'Y', target: 0 }, 0).length > 0);
  assert.ok(validateGoalInput({ pillar: 'Y', target: 8 }, 0).length > 0);
  assert.ok(validateGoalInput({ pillar: 'Y', target: 3 }, 6).length > 0);

  const goal = { id: 'g-1', pillar: 'Y', target: 3, weekStart: '2026-09-14' };
  const edited = updateGoalInList([goal], 'g-1', { pillar: 'M', target: 5 });
  assert.equal(edited.length, 1);
  assert.equal(edited[0].id, 'g-1');
  assert.equal(edited[0].pillar, 'M');
  assert.equal(edited[0].target, 5);
  assert.equal(edited[0].weekStart, '2026-09-14');
  assert.deepEqual(updateGoalInList([goal], 'missing', { target: 5 }), [goal]);

  const events = [
    { date: '2026-09-14', pillar: 'M' },
    { date: '2026-09-15', pillar: 'M' },
    { date: '2026-09-15', pillar: 'Y' },
    { date: '2026-09-21', pillar: 'M' },
  ];
  assert.equal(goalProgress({ ...goal, pillar: 'M' }, events), 2);

  const created = createGoal({ pillar: 'E', target: 2, weekStart: '2026-09-14' });
  assert.ok(created.id.startsWith('g-'));
  assert.equal(created.pillar, 'E');
});

test('XP levels are configurable thresholds with progress to next', () => {
  assert.ok(XP_LEVELS.length >= 2);
  assert.equal(xpLevelFor(0).name, XP_LEVELS[0].name);
  assert.equal(xpLevelFor(99).name, 'Seedling');
  assert.equal(xpLevelFor(100).name, 'Sprout');
  assert.equal(xpLevelFor(100).xpForNext, 200);
  assert.equal(xpLevelFor(300).name, 'Groove');
  assert.equal(xpLevelFor(100000).nextMinXp, null);
  assert.equal(xpLevelFor(100000).xpForNext, null);
});

test('legacy badge ids survive the timestamp format without invented dates', () => {
  const user = { id: 'legacy-badges@example.com' };
  __store.set(userKey('swasth.badges.v1', user), JSON.stringify(['first_step', 'bogus-id']));
  assert.deepEqual(getBadges(user), ['first_step']);
  assert.deepEqual(getBadgeRecords(user), [{ id: 'first_step', earnedAt: null }]);
  for (const r of getBadgeRecords(user)) {
    assert.deepEqual(Object.keys(r).sort(), ['earnedAt', 'id']);
  }
});

test('new badge awards record timestamps once and never duplicate', () => {
  const user = { id: 'fresh-badges@example.com' };
  __store.delete(userKey('swasth.badges.v1', user));
  const fresh = awardBadges(user, ['first_step', 'first_step', 'nope']);
  assert.deepEqual(fresh, ['first_step']);
  const records = getBadgeRecords(user);
  assert.equal(records.length, 1);
  assert.equal(records[0].id, 'first_step');
  assert.ok(typeof records[0].earnedAt === 'string' && !Number.isNaN(Date.parse(records[0].earnedAt)));
  assert.deepEqual(awardBadges(user, ['first_step']), []);
  assert.equal(getBadgeRecords(user).length, 1);
});

test('per-user browser stores stay isolated (goals, prefs, badges)', () => {
  const a = { id: 'user-a@example.com' };
  const b = { id: 'user-b@example.com' };
  assert.notEqual(userKey(GOAL_STORE_KEY, a), userKey(GOAL_STORE_KEY, b));
  saveForUser('swasth.profilePrefs.v1', a, { city: 'Delhi' });
  saveForUser('swasth.profilePrefs.v1', b, { city: 'Mumbai' });
  assert.equal(loadForUser('swasth.profilePrefs.v1', a, {}).city, 'Delhi');
  assert.equal(loadForUser('swasth.profilePrefs.v1', b, {}).city, 'Mumbai');
  assert.equal(loadForUser('swasth.profilePrefs.v1', null, null), null);
});
