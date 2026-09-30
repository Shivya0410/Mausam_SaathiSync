// Finding the best contiguous block of hours. Shared by the run window, the
// outdoor comfort window and the spray window. Pure.

import { HOUR_MS, hourOfIso } from '../time.js';

/**
 * Split scored hours into runs of consecutive hours that pass `allowed`.
 * @param {Array<{time:string}>} hours sorted
 */
export function contiguousRuns(hours, allowed) {
  const runs = [];
  let run = [];
  let prevMs = null;
  for (const h of hours) {
    const t = Date.parse(h.time);
    const ok = allowed(h);
    if (ok && run.length && t - prevMs === HOUR_MS) {
      run.push(h);
    } else {
      if (run.length) runs.push(run);
      run = ok ? [h] : [];
    }
    prevMs = t;
  }
  if (run.length) runs.push(run);
  return runs;
}

/**
 * Best block of `size` consecutive allowed hours by mean score, then widened
 * over neighbouring allowed hours whose score is within `tolerance` of the
 * block mean. Widening turns "the single best hour" into the continuous
 * window people actually plan around ("5 to 7 AM").
 *
 * Returns { start, end, score, hours } where end is exclusive (the end of the
 * last hour), or null when no block reaches `minScore`.
 */
export function bestBlock(hours, { size = 1, allowed = () => true, minScore = 0, tolerance = 5 } = {}) {
  let best = null;
  for (const run of contiguousRuns(hours, allowed)) {
    for (let i = 0; i + size <= run.length; i++) {
      const block = run.slice(i, i + size);
      const mean = block.reduce((s, h) => s + h.score, 0) / size;
      if (mean >= minScore && (!best || mean > best.mean)) best = { run, i, mean };
    }
  }
  if (!best) return null;
  let lo = best.i;
  let hi = best.i + size - 1;
  const floor = Math.max(minScore, best.mean - tolerance);
  while (lo > 0 && best.run[lo - 1].score >= floor) lo--;
  while (hi < best.run.length - 1 && best.run[hi + 1].score >= floor) hi++;
  const block = best.run.slice(lo, hi + 1);
  return {
    start: block[0].time,
    end: endOfHour(block[block.length - 1].time),
    score: Math.round(best.mean),
    hours: block,
  };
}

/** Longest run of allowed hours (ties: earliest). Used by the spray window. */
export function longestRun(hours, allowed) {
  const runs = contiguousRuns(hours, allowed);
  if (!runs.length) return null;
  const run = runs.reduce((a, b) => (b.length > a.length ? b : a));
  return { start: run[0].time, end: endOfHour(run[run.length - 1].time), hours: run };
}

/** ISO time one hour after `iso`, keeping the same offset text. */
export function endOfHour(iso) {
  const h = hourOfIso(iso);
  const date = iso.slice(0, 10);
  const rest = iso.slice(13); // ":00:00+05:30"
  if (h < 23) return `${date}T${String(h + 1).padStart(2, '0')}${rest}`;
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return `${d.toISOString().slice(0, 10)}T00${rest}`;
}

/** True when the hour's local start hour lies in [fromHour, toHour). */
export function hourIn(iso, fromHour, toHour) {
  const h = hourOfIso(iso);
  return h >= fromHour && h < toHour;
}
