import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EMPTY_WEEKLY_GOALS,
  __clearWeeklyGoalsStoreCache,
  getWeeklyGoalsServerSnapshot,
  getWeeklyGoalsSnapshot,
  subscribeToWeeklyGoalsStore,
} from '../src/lib/weeklyGoalsStore.js';

import {
  PROFILE_PREFS_DEFAULTS,
  __clearProfilePrefsStoreCache,
  getProfilePrefsServerSnapshot,
  getProfilePrefsSnapshot,
  subscribeToProfilePrefsStore,
} from '../src/lib/profilePrefsStore.js';

// Minimal window/localStorage mock for the external-store helpers. Installed
// per-test and restored afterwards so other test files are unaffected.
function installWindowMock() {
  const prevWindow = globalThis.window;
  const store = new Map();
  const listeners = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    },
    addEventListener: (type, cb) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(cb);
    },
    removeEventListener: (type, cb) => {
      listeners.get(type)?.delete(cb);
    },
    dispatchEvent: (event) => {
      for (const cb of listeners.get(event.type) ?? []) cb(event);
      return true;
    },
  };
  return {
    store,
    restore() {
      __clearWeeklyGoalsStoreCache();
      __clearProfilePrefsStoreCache();
      if (prevWindow === undefined) delete globalThis.window;
      else globalThis.window = prevWindow;
    },
  };
}

test('weekly goals server snapshot is a stable cached reference', () => {
  assert.equal(getWeeklyGoalsServerSnapshot(), getWeeklyGoalsServerSnapshot());
  assert.equal(getWeeklyGoalsServerSnapshot(), EMPTY_WEEKLY_GOALS);
});

test('weekly goals client snapshot is stable while raw is unchanged', () => {
  const ctx = installWindowMock();
  try {
    const key = 'swasth.goals.v1::id:a@example.com';
    ctx.store.set(key, JSON.stringify([{ id: 'g-1', pillar: 'Y', target: 3 }]));
    const first = getWeeklyGoalsSnapshot(key);
    assert.equal(first, getWeeklyGoalsSnapshot(key));
    assert.equal(first, getWeeklyGoalsSnapshot(key), 'repeated reads stay referentially stable');
    assert.deepEqual(first, [{ id: 'g-1', pillar: 'Y', target: 3 }]);
  } finally {
    ctx.restore();
  }
});

test('weekly goals snapshot updates only when storage value changes', () => {
  const ctx = installWindowMock();
  try {
    const key = 'swasth.goals.v1::id:a@example.com';
    ctx.store.set(key, JSON.stringify([{ id: 'g-1', pillar: 'Y', target: 3 }]));
    const before = getWeeklyGoalsSnapshot(key);
    ctx.store.set(key, JSON.stringify([{ id: 'g-1', pillar: 'Y', target: 3 }, { id: 'g-2', pillar: 'M', target: 2 }]));
    const after = getWeeklyGoalsSnapshot(key);
    assert.notEqual(before, after);
    assert.equal(after, getWeeklyGoalsSnapshot(key));
    assert.equal(after.length, 2);
  } finally {
    ctx.restore();
  }
});

test('weekly goals empty/missing/corrupt share the stable empty snapshot', () => {
  const ctx = installWindowMock();
  try {
    const missing = getWeeklyGoalsSnapshot('swasth.goals.v1::id:missing@example.com');
    assert.equal(missing, EMPTY_WEEKLY_GOALS);
    assert.equal(getWeeklyGoalsSnapshot('swasth.goals.v1::id:missing@example.com'), EMPTY_WEEKLY_GOALS);

    const nonArray = 'swasth.goals.v1::id:obj@example.com';
    ctx.store.set(nonArray, JSON.stringify({ id: 'g-1' }));
    assert.equal(getWeeklyGoalsSnapshot(nonArray), EMPTY_WEEKLY_GOALS);

    const corrupt = 'swasth.goals.v1::id:corrupt@example.com';
    ctx.store.set(corrupt, '{not-json');
    assert.equal(getWeeklyGoalsSnapshot(corrupt), EMPTY_WEEKLY_GOALS);
    assert.equal(getWeeklyGoalsSnapshot(corrupt), EMPTY_WEEKLY_GOALS);
  } finally {
    ctx.restore();
  }
});

test('weekly goals per-user keys stay isolated', () => {
  const ctx = installWindowMock();
  try {
    const keyA = 'swasth.goals.v1::id:a@example.com';
    const keyB = 'swasth.goals.v1::id:b@example.com';
    ctx.store.set(keyA, JSON.stringify([{ id: 'g-a', pillar: 'Y', target: 3 }]));
    ctx.store.set(keyB, JSON.stringify([{ id: 'g-b', pillar: 'M', target: 2 }]));
    const snapA = getWeeklyGoalsSnapshot(keyA);
    const snapB = getWeeklyGoalsSnapshot(keyB);
    assert.notEqual(snapA, snapB);
    ctx.store.set(keyB, JSON.stringify([{ id: 'g-b2', pillar: 'E', target: 1 }]));
    assert.equal(getWeeklyGoalsSnapshot(keyA), snapA, 'mutating B keeps A reference');
    assert.notEqual(getWeeklyGoalsSnapshot(keyB), snapB);
  } finally {
    ctx.restore();
  }
});

test('weekly goals subscribe notifies and cleans up (SSR-safe noop)', () => {
  const ctx = installWindowMock();
  try {
    let calls = 0;
    const cleanup = subscribeToWeeklyGoalsStore(() => {
      calls += 1;
    });
    globalThis.window.dispatchEvent({ type: 'swasth:storage' });
    assert.equal(calls, 1);
    cleanup();
    globalThis.window.dispatchEvent({ type: 'swasth:storage' });
    assert.equal(calls, 1);
  } finally {
    ctx.restore();
  }
});

test('profile prefs server snapshot is a stable cached reference', () => {
  assert.equal(getProfilePrefsServerSnapshot(), getProfilePrefsServerSnapshot());
  assert.equal(getProfilePrefsServerSnapshot(), PROFILE_PREFS_DEFAULTS);
});

test('profile prefs client snapshot is stable while raw is unchanged', () => {
  const ctx = installWindowMock();
  try {
    const key = 'swasth.profilePrefs.v1::id:a@example.com';
    ctx.store.set(key, JSON.stringify({ city: 'Delhi' }));
    const first = getProfilePrefsSnapshot(key);
    assert.equal(first, getProfilePrefsSnapshot(key));
    assert.equal(first.city, 'Delhi');
    assert.equal(first.goal, '');
  } finally {
    ctx.restore();
  }
});

test('profile prefs snapshot updates only when storage value changes', () => {
  const ctx = installWindowMock();
  try {
    const key = 'swasth.profilePrefs.v1::id:a@example.com';
    ctx.store.set(key, JSON.stringify({ city: 'Delhi' }));
    const before = getProfilePrefsSnapshot(key);
    ctx.store.set(key, JSON.stringify({ city: 'Mumbai' }));
    const after = getProfilePrefsSnapshot(key);
    assert.notEqual(before, after);
    assert.equal(after, getProfilePrefsSnapshot(key));
    assert.equal(after.city, 'Mumbai');
  } finally {
    ctx.restore();
  }
});

test('profile prefs empty/missing/corrupt share the stable defaults snapshot', () => {
  const ctx = installWindowMock();
  try {
    const missing = getProfilePrefsSnapshot('swasth.profilePrefs.v1::id:missing@example.com');
    assert.equal(missing, PROFILE_PREFS_DEFAULTS);
    assert.equal(getProfilePrefsSnapshot('swasth.profilePrefs.v1::id:missing@example.com'), PROFILE_PREFS_DEFAULTS);

    const corrupt = 'swasth.profilePrefs.v1::id:corrupt@example.com';
    ctx.store.set(corrupt, '{not-json');
    assert.equal(getProfilePrefsSnapshot(corrupt), PROFILE_PREFS_DEFAULTS);
    assert.equal(getProfilePrefsSnapshot(corrupt), PROFILE_PREFS_DEFAULTS);
  } finally {
    ctx.restore();
  }
});

test('profile prefs per-user keys stay isolated', () => {
  const ctx = installWindowMock();
  try {
    const keyA = 'swasth.profilePrefs.v1::id:a@example.com';
    const keyB = 'swasth.profilePrefs.v1::id:b@example.com';
    ctx.store.set(keyA, JSON.stringify({ city: 'Delhi' }));
    ctx.store.set(keyB, JSON.stringify({ city: 'Mumbai' }));
    const snapA = getProfilePrefsSnapshot(keyA);
    const snapB = getProfilePrefsSnapshot(keyB);
    assert.notEqual(snapA, snapB);
    assert.equal(snapA.city, 'Delhi');
    assert.equal(snapB.city, 'Mumbai');
    ctx.store.set(keyB, JSON.stringify({ city: 'Jaipur' }));
    assert.equal(getProfilePrefsSnapshot(keyA), snapA, 'mutating B keeps A reference');
    assert.notEqual(getProfilePrefsSnapshot(keyB), snapB);
  } finally {
    ctx.restore();
  }
});

test('profile prefs subscribe notifies and cleans up', () => {
  const ctx = installWindowMock();
  try {
    let calls = 0;
    const cleanup = subscribeToProfilePrefsStore(() => {
      calls += 1;
    });
    globalThis.window.dispatchEvent({ type: 'swasth:storage' });
    assert.equal(calls, 1);
    cleanup();
    globalThis.window.dispatchEvent({ type: 'swasth:storage' });
    assert.equal(calls, 1);
  } finally {
    ctx.restore();
  }
});
