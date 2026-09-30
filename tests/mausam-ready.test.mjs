// Be ready (PRD 9.4): season habits, capped XP, streaks, kits and badges.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PILLARS, XP, readySeason, toggleHabit, xpForDay, xpTotals, weekStart, streak, longestStreak, KITS, kitDone,
  toggleKitItem, earnedBadges, awardBadges, recentDays, markRead, recordQuiz, READY_DEFAULT, BADGES, KIT_FOR_SEASON,
} from '../src/lib/mausam/ready.js';
import { addDays } from '../src/lib/mausam/time.js';

const S0 = READY_DEFAULT;

test('habits are tagged with the season of their date', () => {
  assert.equal(readySeason('2026-05-10'), 'summer');
  assert.equal(readySeason('2026-07-10'), 'monsoon');
  assert.equal(readySeason('2026-12-10'), 'winter');
  assert.equal(readySeason('2026-10-10'), 'postMonsoon');
  const s = toggleHabit(S0, '2026-07-10', 'P');
  assert.deepEqual(s.log['2026-07-10'], { p: ['P'], season: 'monsoon' });
  assert.deepEqual(toggleHabit(s, '2026-07-10', 'P').log['2026-07-10'].p, []);
  assert.equal(toggleHabit(s, '2026-07-10', 'P', true), s, 'setting an on habit on is a no-op');
  assert.equal(toggleHabit(s, '2026-07-10', 'Z'), s, 'unknown pillar ignored');
  const all = PILLARS.reduce((acc, p) => toggleHabit(acc, '2026-07-11', p), S0);
  assert.deepEqual(all.log['2026-07-11'].p, ['A', 'P', 'S', 'H']);
  for (const k of Object.values(KIT_FOR_SEASON)) assert.ok(KITS[k].length >= 8 && KITS[k].length <= 12, k);
});

test('XP: 10 per habit, +10 for all four, 50 a day, 350 a week', () => {
  assert.equal(xpForDay([]), 0);
  assert.equal(xpForDay(['A', 'A', 'P']), 20);
  assert.equal(xpForDay(PILLARS), 50);
  assert.equal(weekStart('2026-10-01'), '2026-09-28');
  let s = S0;
  for (let i = 0; i < 10; i++) for (const p of PILLARS) s = toggleHabit(s, addDays('2026-09-28', i), p);
  const x = xpTotals(s.log, '2026-10-04');
  assert.equal(x.today, 50);
  assert.equal(x.week, XP.maxPerWeek);
  assert.equal(x.total, 350 + 150, 'first week capped at 350, second has 3 days');
});

test('streaks count consecutive days and survive until today is logged', () => {
  let s = S0;
  for (const d of ['2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29']) s = toggleHabit(s, d, 'A');
  assert.equal(streak(s.log, '2026-09-29'), 4);
  assert.equal(streak(s.log, '2026-09-30'), 4, 'yesterday still counts');
  assert.equal(streak(s.log, '2026-10-01'), 0);
  s = toggleHabit(s, '2026-09-20', 'A');
  assert.equal(longestStreak(s.log), 4);
});

test('kits complete when every item is ticked', () => {
  let s = S0;
  for (const i of KITS.monsoon.slice(0, -1)) s = toggleKitItem(s, 'monsoon', i);
  assert.equal(kitDone(s, 'monsoon'), false);
  s = toggleKitItem(s, 'monsoon', KITS.monsoon.at(-1));
  assert.equal(kitDone(s, 'monsoon'), true);
  s = toggleKitItem(s, 'monsoon', 'torch');
  assert.equal(kitDone(s, 'monsoon'), false);
});

test('badges follow the PRD table and are awarded once', () => {
  let s = S0;
  assert.deepEqual(earnedBadges(s), []);
  s = toggleHabit(s, '2026-05-01', 'A');
  assert.deepEqual(earnedBadges(s), ['first_check']);
  for (const p of PILLARS) s = toggleHabit(s, '2026-05-02', p, true);
  assert.ok(earnedBadges(s).includes('ready_day'));
  for (let i = 0; i < 7; i++) s = toggleHabit(s, addDays('2026-05-03', i), 'S', true);
  const e = earnedBadges(s);
  assert.ok(e.includes('week_ready'));
  assert.ok(!e.includes('heat_hero'), '8 summer Safe days is not yet 10');
  s = toggleHabit(s, '2026-05-20', 'S', true);
  s = toggleHabit(s, '2026-05-21', 'S', true);
  assert.ok(earnedBadges(s).includes('heat_hero'));

  assert.ok(!earnedBadges(markRead(s, 'lightning', 'x')).includes('lightning_smart'), 'reading alone is not enough');
  assert.ok(earnedBadges(recordQuiz(markRead(s, 'lightning', 'x'), 'lightning', { passed: true })).includes('lightning_smart'));
  assert.ok(earnedBadges(s, { skySnaps: 5 }).includes('sky_watcher'));
  assert.ok(!earnedBadges(s, { myReports: [{ status: 'unverified', confirmations: 0 }] }).includes('citizen_reporter'));
  assert.ok(earnedBadges(s, { myReports: [{ status: 'ai_verified' }] }).includes('citizen_reporter'));
  assert.ok(earnedBadges(recordQuiz(s, 'myths', { done: true, score: 7 })).includes('weather_wise'));
  let w = markRead(S0, 'fog', 'x');
  for (let i = 0; i < 5; i++) w = toggleHabit(w, addDays('2026-12-01', i), 'S');
  assert.ok(earnedBadges(w).includes('fog_safe'));

  const a = awardBadges(S0, ['first_check', 'bogus'], '2026-05-01T00:00:00Z');
  assert.deepEqual(a.fresh, ['first_check']);
  const b = awardBadges(a.state, ['first_check', 'ready_day'], '2026-05-02T00:00:00Z');
  assert.deepEqual(b.fresh, ['ready_day']);
  assert.equal(b.state.badges.find((x) => x.id === 'first_check').earnedAt, '2026-05-01T00:00:00Z', 'dates never change');
  assert.equal(awardBadges(b.state, ['ready_day'], 'z').state, b.state);
  assert.equal(BADGES.length, 11);
});

test('recentDays lists the last n days oldest first', () => {
  const s = toggleHabit(S0, '2026-09-30', 'A');
  const d = recentDays(s.log, '2026-09-30', 7);
  assert.equal(d.length, 7);
  assert.equal(d[0].date, '2026-09-24');
  assert.deepEqual(d.at(-1), { date: '2026-09-30', count: 1 });
});
