import test from 'node:test';
import assert from 'node:assert/strict';

import { logHabit, getSustainSummary } from '../src/server/domains/habits.js';
import { createCheckIn, findCheckIn } from '../src/server/domains/checkIns.js';
import { getPreferences, updatePreferences } from '../src/server/domains/preferences.js';
import { getDashboard } from '../src/server/domains/dashboard.js';
import { ErrorCode } from '../src/server/http/errors.js';

// The repository is a process-wide singleton, so each test uses its own owner
// id. That is also a more honest test of owner scoping than a reset would be.
let ownerSequence = 0;
const nextOwner = () => `owner_${(ownerSequence += 1)}`;

const habit = { kind: 'water', quantity: 250, localDate: '2026-09-14' };

test('a habit replayed with the same idempotency key is not written twice', async () => {
  const owner = nextOwner();

  const first = await logHabit(owner, habit, 'key-1');
  assert.equal(first.replayed, false);

  const second = await logHabit(owner, habit, 'key-1');
  assert.equal(second.replayed, true);
  assert.deepEqual(second.record, first.record);

  const summary = await getSustainSummary(owner);
  assert.equal(summary.entryCount, 1, 'the retry must not create a second entry');
  assert.equal(summary.totalsByKind.water, 250);
});

test('reusing an idempotency key with a different body is a conflict', async () => {
  const owner = nextOwner();
  await logHabit(owner, habit, 'key-2');

  await assert.rejects(
    () => logHabit(owner, { ...habit, quantity: 999 }, 'key-2'),
    (error) => error.code === ErrorCode.CONFLICT && error.status === 409
  );

  const summary = await getSustainSummary(owner);
  assert.equal(summary.entryCount, 1);
});

test('a habit write without an idempotency key is rejected', async () => {
  await assert.rejects(
    () => logHabit(nextOwner(), habit, null),
    (error) => error.code === ErrorCode.VALIDATION_FAILED
  );
});

test('the sustain summary is derived from the log, not a stored total', async () => {
  const owner = nextOwner();
  await logHabit(owner, { kind: 'water', quantity: 200, localDate: '2026-09-14' }, 'a');
  await logHabit(owner, { kind: 'water', quantity: 300, localDate: '2026-09-15' }, 'b');
  await logHabit(owner, { kind: 'steps', quantity: 4000, localDate: '2026-09-15' }, 'c');

  const summary = await getSustainSummary(owner);
  assert.equal(summary.totalsByKind.water, 500);
  assert.equal(summary.totalsByKind.steps, 4000);
  assert.equal(summary.activeDayCount, 2);
  assert.equal(summary.entryCount, 3);
});

test('no carbon figure is invented', async () => {
  const summary = await getSustainSummary(nextOwner());
  assert.equal(summary.carbonEstimate, null);
  assert.match(summary.carbonEstimateNote, /emission factor/);
});

test('an owner with no activity gets zeroes, not placeholder numbers', async () => {
  const summary = await getSustainSummary(nextOwner());
  assert.equal(summary.entryCount, 0);
  assert.equal(summary.activeDayCount, 0);
  assert.deepEqual(summary.totalsByKind, { water: 0, steps: 0, movement: 0, mindfulness: 0 });
});

test('one owner cannot see another owner records', async () => {
  const a = nextOwner();
  const b = nextOwner();

  await logHabit(a, habit, 'key-a');
  await updatePreferences(a, { locale: 'hi' });
  await createCheckIn(a, { localDate: '2026-09-14', energy: 'high' });

  assert.equal((await getSustainSummary(b)).entryCount, 0);
  assert.equal((await getPreferences(b)).locale, 'en', 'b must get defaults, not a preferences');
  assert.equal(await findCheckIn(b, '2026-09-14'), null);
});

test('a second check-in on the same date is a conflict rather than an overwrite', async () => {
  const owner = nextOwner();
  const created = await createCheckIn(owner, { localDate: '2026-09-14', energy: 'low', note: 'tired' });
  assert.equal(created.energy, 'low');

  await assert.rejects(
    () => createCheckIn(owner, { localDate: '2026-09-14', energy: 'high' }),
    (error) => error.code === ErrorCode.CONFLICT
  );

  const stored = await findCheckIn(owner, '2026-09-14');
  assert.equal(stored.energy, 'low', 'the original answer must survive');
});

test('preferences default before any write and increment a version after', async () => {
  const owner = nextOwner();

  const before = await getPreferences(owner);
  assert.equal(before.isDefault, true);
  assert.equal(before.version, 0);

  const after = await updatePreferences(owner, { locale: 'hi', largeText: true });
  assert.equal(after.isDefault, false);
  assert.equal(after.version, 1);
  assert.equal(after.locale, 'hi');
  assert.equal(after.largeText, true);
  assert.equal(after.timezone, 'Asia/Kolkata', 'untouched fields keep their default');
});

test('preferences reject fields outside their scope', async () => {
  await assert.rejects(
    () => updatePreferences(nextOwner(), { medicalHistory: 'asthma' }),
    (error) => error.code === ErrorCode.VALIDATION_FAILED
  );
});

test('the dashboard composes domains and reports an empty state honestly', async () => {
  const owner = nextOwner();

  const empty = await getDashboard(owner, '2026-09-14');
  assert.equal(empty.hasAnyActivity, false);
  assert.equal(empty.today.checkInCompleted, false);
  assert.equal(empty.sustain.entryCount, 0);

  await createCheckIn(owner, { localDate: '2026-09-14', energy: 'medium' });
  const filled = await getDashboard(owner, '2026-09-14');
  assert.equal(filled.hasAnyActivity, true);
  assert.equal(filled.today.checkInCompleted, true);
});

test('presented records never carry the internal ownerId field', async () => {
  const owner = nextOwner();
  const { record } = await logHabit(owner, habit, 'key-presented');
  const checkIn = await createCheckIn(owner, { localDate: '2026-09-20', energy: 'high' });

  assert.equal('ownerId' in record, false);
  assert.equal('ownerId' in checkIn, false);
});
