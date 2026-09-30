// Household mode: merge several members' cards into one "Everyone" list
// (PRD section 3.6). Pure.

import { T } from '../thresholds.js';

/**
 * @param {Array<{ member: { id: string }, placeId: string, cards: Array }>} perMember
 *   in member order
 * @param {number} [max=6]
 * @returns {{ cards: Array, total: number }} each card gains `members` (ids)
 */
export function mergeHouseholdCards(perMember, max = T.cards.maxTipsPerMember) {
  const byKey = new Map();
  perMember.forEach(({ member, placeId, cards }, memberIndex) => {
    for (const card of cards) {
      // Official cards are keyed by the warning; tips by rule.
      const key = `${card.kind === 'official' ? card.id : card.ruleId}@${placeId}`;
      const existing = byKey.get(key);
      if (existing) {
        if (!existing.members.includes(member.id)) existing.members.push(member.id);
      } else {
        byKey.set(key, { ...card, placeId, members: [member.id], memberIndex });
      }
    }
  });
  const kindRank = (c) => (c.kind === 'official' ? 0 : c.kind === 'good' ? 2 : 1);
  const merged = [...byKey.values()].sort(
    (a, b) => kindRank(a) - kindRank(b) || b.severity - a.severity || a.memberIndex - b.memberIndex,
  );
  return { cards: merged.slice(0, max), total: merged.length };
}
