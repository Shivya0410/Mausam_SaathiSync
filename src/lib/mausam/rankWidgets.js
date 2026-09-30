// Homepage widget ranking (PRD sections 5.11 and 27.5). Pure.
//
//   score = personaWeight × urgency × context × habit
//
// personaWeight: best weight across the user's personas (secondary × 0.7).
// urgency: × 1.8 for an active official warning on the widget's data,
//          × 1.3 for a tip of severity >= 2 on the widget's data.
// context: season × time-of-day multipliers from the registry.
// habit:   up to +20% for widgets the user taps often.

import { hazardGroup } from './hazards.js';
import { T } from './thresholds.js';

const ANCHORS = [
  ['hourly', 5], // index <= 5 means position <= 6
  ['daily', 9],
];

/**
 * Urgency multipliers from active warnings and fired cards.
 * @param {object} args { widgetHazards, warnings, cards, air }
 * @returns {Object<string, number>}
 */
export function widgetUrgency({ widgetHazards, warnings = [], cards = [], air = null }) {
  const officialGroups = new Set(warnings.filter((w) => w.level >= 2).map((w) => hazardGroup(w.hazard)));
  if (air?.aqi >= T.aqi.veryPoor) officialGroups.add('air');
  const tipGroups = new Set(cards.filter((c) => c.kind === 'tip' && c.severity >= 2).map((c) => c.hazard).filter(Boolean));
  const out = {};
  for (const [id, groups] of Object.entries(widgetHazards)) {
    if (groups.some((g) => officialGroups.has(g))) out[id] = 1.8;
    else if (groups.some((g) => tipGroups.has(g))) out[id] = 1.3;
  }
  return out;
}

/**
 * @param {object} args
 * @param {Array} args.widgets registry
 * @param {Array<{id:string, role:'primary'|'secondary'}>} args.personas
 * @param {string} args.season
 * @param {string} args.timeOfDay
 * @param {Object<string,number>} [args.urgency]
 * @param {{pinned?:string[], hidden?:string[], order?:string[]}} [args.layout]
 * @param {{widgetTaps?:Object<string,number>}} [args.usage]
 * @param {Object<string,number>} [args.boost] extra multipliers (e.g. NE monsoon rain)
 * @returns {Array<{ id, score, pinned, rankReason }>}
 */
export function rankWidgets({ widgets, personas, season, timeOfDay, urgency = {}, layout = {}, usage = {}, boost = {} }) {
  const pinned = layout.pinned || [];
  const hidden = new Set(layout.hidden || []);
  const people = personas?.length ? personas : [{ id: 'citizen', role: 'primary' }];
  const scored = [];

  for (const w of widgets) {
    if (hidden.has(w.id)) continue;
    let personaWeight = 0;
    let bestPersona = null;
    for (const p of people) {
      const weight = (w.personas[p.id] || 0) * (p.role === 'primary' ? 1 : 0.7);
      if (weight > personaWeight) {
        personaWeight = weight;
        bestPersona = p.id;
      }
    }
    const isPinned = pinned.includes(w.id);
    if (personaWeight === 0 && !isPinned) continue;
    const u = urgency[w.id] || 1;
    const ctx = (w.seasons?.[season] ?? 1) * (w.timeOfDay?.[timeOfDay] ?? 1) * (boost[w.id] ?? 1);
    const habit = 1 + Math.min(0.2, 0.02 * (usage.widgetTaps?.[w.id] || 0));
    scored.push({
      id: w.id,
      score: Math.round(personaWeight * u * ctx * habit * 100) / 100,
      pinned: isPinned,
      rankReason: {
        persona: bestPersona,
        season: (w.seasons?.[season] ?? 1) > 1 ? season : null,
        timeOfDay: (w.timeOfDay?.[timeOfDay] ?? 1) > 1 ? timeOfDay : null,
        urgent: u > 1 ? (u >= 1.8 ? 'official' : 'tip') : null,
        pinned: isPinned,
      },
    });
  }

  const pinnedList = pinned.map((id) => scored.find((s) => s.id === id)).filter(Boolean);
  let rest = scored.filter((s) => !s.pinned).sort((a, b) => b.score - a.score);
  rest = applyManualOrder(rest, layout.order || []);
  let ordered = [...pinnedList, ...rest];
  for (const [id, maxIndex] of ANCHORS) ordered = enforceAnchor(ordered, id, maxIndex);
  return ordered;
}

/**
 * Respect a manual order for the widgets the user moved: those widgets keep
 * the relative order the user chose, occupying the slots they would have had.
 */
function applyManualOrder(list, order) {
  const manual = order.filter((id) => list.some((w) => w.id === id));
  if (manual.length < 2) return list;
  const slots = list.map((w, i) => (manual.includes(w.id) ? i : -1)).filter((i) => i >= 0);
  const copy = list.slice();
  manual.forEach((id, k) => {
    copy[slots[k]] = list.find((w) => w.id === id);
  });
  return copy;
}

function enforceAnchor(list, id, maxIndex) {
  const i = list.findIndex((w) => w.id === id);
  if (i === -1 || i <= maxIndex) return list;
  const copy = list.slice();
  const [item] = copy.splice(i, 1);
  copy.splice(maxIndex, 0, item);
  return copy;
}
