/**
 * Persona definitions (PRD section 3.2). Use exactly these ids in code.
 *
 * `coast` and `fisher` share one onboarding tile ("Beach and sea"); a
 * follow-up question sets which one. `citizen` is the default when nothing
 * is chosen and never appears as a tile. Labels are i18n keys.
 */
export const PERSONAS = [
  { id: 'health', icon: 'fa-solid fa-lungs', page: '/health', tile: true },
  { id: 'fitness', icon: 'fa-solid fa-person-running', page: '/run', tile: true },
  { id: 'coast', icon: 'fa-solid fa-umbrella-beach', page: '/coast', tile: true },
  { id: 'fisher', icon: 'fa-solid fa-fish', page: '/coast', tile: false },
  { id: 'travel', icon: 'fa-solid fa-plane', page: '/travel', tile: true },
  { id: 'family', icon: 'fa-solid fa-children', page: '/family', tile: true },
  { id: 'farm', icon: 'fa-solid fa-wheat-awn', page: '/farm', tile: true },
  { id: 'commute', icon: 'fa-solid fa-motorcycle', page: '/commute', tile: true },
  { id: 'events', icon: 'fa-solid fa-champagne-glasses', page: '/events', tile: true },
  { id: 'work', icon: 'fa-solid fa-helmet-safety', page: '/work', tile: true },
  { id: 'citizen', icon: 'fa-solid fa-user', page: null, tile: false },
].map((p) => ({ ...p, nameKey: `personas.${p.id}.name`, descKey: `personas.${p.id}.desc` }));

export const PERSONA_IDS = PERSONAS.map((p) => p.id);

export const DEFAULT_PERSONA = 'citizen';

/** Maximum personas per person: one primary plus two secondary (PRD 3.1). */
export const MAX_PERSONAS = 3;

/** Health sensitivities offered at onboarding; stored only on the device. */
export const SENSITIVITIES = ['asthma', 'allergies', 'skin', 'heart', 'elderly', 'pregnant', 'children'];

export function isPersona(id) {
  return PERSONA_IDS.includes(id);
}
