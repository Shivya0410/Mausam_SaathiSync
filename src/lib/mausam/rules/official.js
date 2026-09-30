// Official IMD and NDMA warnings as OFFICIAL cards (PRD section 6.5). Pure.
//
// Official text is carried verbatim. The app never invents, softens or
// upgrades a warning: level and text come straight from the issuer.

import { hazardGroup, levelName, ADVICE_GROUPS } from '../hazards.js';

/**
 * @param {object} ctx rule context
 * @returns {Array} OFFICIAL cards, ordered Red, Orange, Yellow
 */
export function officialCards(ctx) {
  return ctx.officialWarnings
    .filter((w) => w.level >= 2)
    .filter((w) => !w.validFrom || Date.parse(w.validFrom) <= ctx.nowMs + 5 * 24 * 3600e3)
    .sort((a, b) => b.level - a.level || String(a.validFrom).localeCompare(String(b.validFrom)))
    .map((w) => {
      const group = hazardGroup(w.hazard);
      return {
        id: `official.${w.id}`,
        ruleId: `official.${w.source}`,
        kind: 'official',
        severity: w.level,
        hazard: group,
        params: {
          warningId: w.id,
          hazard: w.hazard,
          level: w.level,
          levelName: levelName(w.level),
          title: w.title,
          text: w.text,
          instruction: w.instruction ?? null,
          area: w.area,
          issuer: w.issuer,
          issuedAt: w.issuedAt,
          validFrom: w.validFrom,
          validTo: w.validTo,
          source: w.source,
          startsAt: w.validFrom,
        },
        // i18n key for the official-advice line (PRD 6.5 table), when one exists.
        adviceKey: ADVICE_GROUPS.includes(group) ? `officialAdvice.${group}.${levelName(w.level)}` : null,
        addOns: [],
        chips: [],
        sources: [{ name: w.source }],
        whyKey: 'rules.official.why',
        dismissible: false,
      };
    });
}
