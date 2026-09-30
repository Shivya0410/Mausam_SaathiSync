// The rules engine (PRD sections 6.2 to 6.4). Pure: no clock, no storage.
//
// Selection and ordering:
//   1. Official warnings become OFFICIAL cards, always first (Red > Orange > Yellow).
//   2. A tip whose hazard group matches an active official warning is not
//      shown; its advice is attached to the official card instead, so a
//      milder tip never sits next to a stronger warning for the same hazard.
//   3. Tips sort by severity, then by how soon they start, then by persona
//      role (primary before secondary).
//   4. A GOOD card is added only when no tip of severity >= 2 fired, so the
//      block is never empty on a calm day and never cheerful on a bad one.

import { generalRules } from './general.js';
import { healthRules } from './health.js';
import { fitnessRules } from './fitness.js';
import { coastRules } from './coast.js';
import { travelRules } from './travel.js';
import { familyRules } from './family.js';
import { farmRules } from './farm.js';
import { commuteRules } from './commute.js';
import { eventRules, workRules } from './events.js';
import { officialCards } from './official.js';
import { buildContext } from './context.js';
import { T } from '../thresholds.js';

export const RULES = Object.freeze([
  ...generalRules,
  ...healthRules,
  ...fitnessRules,
  ...coastRules,
  ...travelRules,
  ...familyRules,
  ...farmRules,
  ...commuteRules,
  ...eventRules,
  ...workRules,
]);

export { buildContext };

/** Index of the user's first persona this rule applies to (primary = 0). */
function personaRank(rule, personas) {
  if (rule.personas.includes('all')) return personas.length;
  const idx = personas.findIndex((p) => rule.personas.includes(p));
  return idx === -1 ? Infinity : idx;
}

function startsAt(card) {
  const t = card.params?.startsAt || card.params?.start || card.params?.time;
  const ms = t ? Date.parse(t) : NaN;
  return Number.isFinite(ms) ? ms : Number.MAX_SAFE_INTEGER;
}

const resolve = (value, match) => (typeof value === 'function' ? value(match) : value);

/**
 * Run all applicable rules.
 *
 * @param {object} ctx from buildContext()
 * @param {object} [state]
 * @param {Set<string>} [state.dismissed] rule ids dismissed today for this place
 * @param {Array} [rules] override for tests
 * @returns {Array} DecisionCard[] (official, then tips, then at most one good card)
 */
export function runRules(ctx, state = {}, rules = RULES) {
  const dismissed = state.dismissed || new Set();
  const official = officialCards(ctx);
  const officialGroups = new Set(official.map((c) => c.hazard).filter(Boolean));

  const fired = [];
  for (const rule of rules) {
    const rank = personaRank(rule, ctx.personas);
    if (rank === Infinity) continue;
    if (dismissed.has(rule.id)) continue;
    let match;
    try {
      match = rule.when(ctx);
    } catch {
      // A rule that cannot evaluate on partial data simply does not fire
      // (PRD edge case E9). It must never take the whole card list down.
      match = null;
    }
    if (!match) continue;
    fired.push({
      id: `${rule.id}:${ctx.dateKey}:${ctx.place?.id ?? 'current'}`,
      ruleId: rule.id,
      kind: rule.kind,
      severity: rule.kind === 'good' ? 0 : rule.severity(match),
      hazard: rule.hazard ?? null,
      params: match,
      chips: resolve(rule.chips, match) || [],
      personas: rule.personas,
      personaRank: rank,
      whyKey: `rules.${rule.id}.why`,
      sources: rule.source || [],
      supersedes: rule.supersedes || [],
      dismissible: true,
    });
  }

  // A stronger tip replaces the weaker tips it names (e.g. Severe air over Poor air).
  const superseded = new Set(fired.flatMap((c) => c.supersedes));
  const tips = [];
  for (const card of fired) {
    if (superseded.has(card.ruleId)) continue;
    if (card.hazard && officialGroups.has(card.hazard)) {
      const host = official.find((o) => o.hazard === card.hazard);
      host.addOns.push({ ruleId: card.ruleId, params: card.params });
      continue;
    }
    tips.push(card);
  }

  const ordered = tips
    .filter((t) => t.kind !== 'good')
    .sort((a, b) => b.severity - a.severity || startsAt(a) - startsAt(b) || a.personaRank - b.personaRank);
  const notable = ordered.some((t) => t.severity >= 2);
  const good = notable ? [] : tips.filter((t) => t.kind === 'good').slice(0, 1);
  return [...official, ...ordered, ...good];
}

/**
 * Homepage cap (PRD 6.4 rule 5): at most `max` tips per member; official
 * cards are never capped. Returns what to show and how many are behind
 * "See all".
 */
export function capTips(cards, max = T.cards.maxTipsPerMember) {
  const official = cards.filter((c) => c.kind === 'official');
  const rest = cards.filter((c) => c.kind !== 'official');
  const shown = [...official, ...rest.slice(0, max)];
  return { shown, total: cards.length, hidden: cards.length - shown.length };
}

/** Convenience: build context and run in one call. */
export function decisionCards(input, state) {
  return runRules(buildContext(input), state);
}
