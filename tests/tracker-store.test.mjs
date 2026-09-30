import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EMPTY_TRACKER_STORE,
  __clearTrackerStoreCache,
  getTrackerServerSnapshot,
  getTrackerSnapshot,
  subscribeToTrackerStore,
} from '../src/lib/trackerStore.js';
import { trackerStoreToEvents } from '../src/lib/activityModel.js';

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
      __clearTrackerStoreCache();
      if (prevWindow === undefined) delete globalThis.window;
      else globalThis.window = prevWindow;
    },
  };
}

test('server snapshot is a stable cached reference (no fresh object per call)', () => {
  assert.equal(getTrackerServerSnapshot(), getTrackerServerSnapshot());
  assert.equal(getTrackerServerSnapshot(), EMPTY_TRACKER_STORE);
});

test('client snapshot is stable while the underlying raw value is unchanged', () => {
  const ctx = installWindowMock();
  try {
    const key = 'swasth.tracker.v1::id:a@example.com';
    ctx.store.set(key, JSON.stringify({ '2026-9': { 14: { Y: true } } }));
    const first = getTrackerSnapshot(key);
    const second = getTrackerSnapshot(key);
    assert.equal(first, second, 'same reference when raw unchanged');

    // A re-read must not allocate when nothing changed (the infinite-loop fix).
    const third = getTrackerSnapshot(key);
    assert.equal(first, third);
  } finally {
    ctx.restore();
  }
});

test('client snapshot changes only when the raw value changes, then stays stable', () => {
  const ctx = installWindowMock();
  try {
    const key = 'swasth.tracker.v1::id:a@example.com';
    ctx.store.set(key, JSON.stringify({ '2026-9': { 14: { Y: true } } }));
    const before = getTrackerSnapshot(key);
    ctx.store.set(key, JSON.stringify({ '2026-9': { 14: { Y: true, M: true } } }));
    const after = getTrackerSnapshot(key);
    assert.notEqual(before, after);
    assert.equal(after, getTrackerSnapshot(key));
  } finally {
    ctx.restore();
  }
});

test('empty/missing/corrupt stores share the stable empty snapshot', () => {
  const ctx = installWindowMock();
  try {
    const missing = getTrackerSnapshot('swasth.tracker.v1::id:missing@example.com');
    assert.equal(missing, EMPTY_TRACKER_STORE);
    assert.equal(getTrackerSnapshot('swasth.tracker.v1::id:missing@example.com'), EMPTY_TRACKER_STORE);

    const corruptKey = 'swasth.tracker.v1::id:corrupt@example.com';
    ctx.store.set(corruptKey, '{not-json');
    assert.equal(getTrackerSnapshot(corruptKey), EMPTY_TRACKER_STORE);
    assert.equal(getTrackerSnapshot(corruptKey), EMPTY_TRACKER_STORE);
  } finally {
    ctx.restore();
  }
});

test('per-user keys stay isolated in the snapshot cache', () => {
  const ctx = installWindowMock();
  try {
    const keyA = 'swasth.tracker.v1::id:a@example.com';
    const keyB = 'swasth.tracker.v1::id:b@example.com';
    ctx.store.set(keyA, JSON.stringify({ '2026-9': { 14: { Y: true } } }));
    ctx.store.set(keyB, JSON.stringify({ '2026-9': { 15: { M: true } } }));
    const snapA = getTrackerSnapshot(keyA);
    const snapB = getTrackerSnapshot(keyB);
    assert.notEqual(snapA, snapB);
    // Mutating B must not change A's cached reference.
    ctx.store.set(keyB, JSON.stringify({ '2026-9': { 16: { M: true } } }));
    assert.equal(getTrackerSnapshot(keyA), snapA);
    assert.notEqual(getTrackerSnapshot(keyB), snapB);
  } finally {
    ctx.restore();
  }
});

test('snapshot feeds only completed qualifying tracker activities', () => {
  const ctx = installWindowMock();
  try {
    const key = 'swasth.tracker.v1::id:a@example.com';
    ctx.store.set(
      key,
      JSON.stringify({
        '2026-9': {
          14: { Y: true, M: true, E: false },
          30: { Y: true }, // future vs todayISO below -> dropped
        },
      })
    );
    const snapshot = getTrackerSnapshot(key);
    const events = trackerStoreToEvents(snapshot, '2026-09-20');
    assert.deepEqual(events, [
      { date: '2026-09-14', pillar: 'M' },
      { date: '2026-09-14', pillar: 'Y' },
    ]);
  } finally {
    ctx.restore();
  }
});

test('subscribe notifies on storage events and cleans up (SSR-safe noop without window)', () => {
  // No window: SSR-safe subscribe returns a noop cleanup.
  const hadWindow = Object.prototype.hasOwnProperty.call(globalThis, 'window');
  if (!hadWindow) {
    const cleanup = subscribeToTrackerStore(() => {});
    assert.equal(typeof cleanup, 'function');
    cleanup();
  }

  const ctx = installWindowMock();
  try {
    let calls = 0;
    const cleanup = subscribeToTrackerStore(() => {
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
