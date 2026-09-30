// Planning helpers for the family, events and work pages. Pure over the
// rules context (`buildContext`), so they are tested without a browser.

import { comfortIndex, slotConditions, SLOTS } from './indices/comfortIndex.js';
import { hourOfIso, addDays } from './time.js';

function slotComfort(ctx, date, slot, day) {
  const [a, b] = SLOTS[slot];
  const hours = ctx.hoursOn(date).filter((h) => hourOfIso(h.time) >= a && hourOfIso(h.time) < b);
  return slotConditions({ hours, day, aqi: ctx.air?.aqi ?? null });
}

/** Saturday and Sunday comfort by slot, within the next 7 days. */
export function weekendPlan(ctx, today) {
  const out = [];
  for (let i = 0; i < 7 && out.length < 2; i++) {
    const date = addDays(today, i);
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    if (dow !== 0 && dow !== 6) continue;
    const day = ctx.daily.find((d) => d.date === date);
    const slots = ['morning', 'afternoon', 'evening']
      .map((slot) => {
        const c = slotComfort(ctx, date, slot, day);
        return c ? { slot, score: comfortIndex(c) } : null;
      })
      .filter(Boolean);
    out.push({ date, slots });
  }
  return out;
}

/** Conditions and comfort for a date and slot, or null beyond the forecast. */
export function dateComfort(ctx, date, slot) {
  const s = SLOTS[slot] ? slot : 'evening';
  const day = ctx.daily.find((d) => d.date === date);
  if (!day) return null;
  const c = slotComfort(ctx, date, s, day);
  return c ? { ...c, score: comfortIndex(c), day } : null;
}

/** "29:12" from milliseconds (lightning takeover timer). */
export function mmss(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
