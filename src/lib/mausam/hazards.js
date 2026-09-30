// Hazard ids (PRD section 12.2.1) and the groups used to match official
// warnings against our own tips. Pure.
//
// A tip is suppressed when an active official warning belongs to the same
// group (PRD section 6.4, rule 3). The group, not the exact hazard, is what
// matters: an IMD "very heavy rain" warning covers our "heavy rain soon" tip.

export const HAZARD_GROUP = Object.freeze({
  heavy_rain: 'rain_heavy',
  very_heavy_rain: 'rain_heavy',
  extremely_heavy_rain: 'rain_heavy',
  thunderstorm: 'thunder',
  lightning: 'thunder',
  squall: 'thunder',
  hailstorm: 'hail',
  dust_storm: 'dust',
  heat_wave: 'heat',
  severe_heat_wave: 'heat',
  hot_humid: 'heat',
  warm_night: 'warm_night',
  cold_wave: 'cold',
  cold_day: 'cold',
  dense_fog: 'fog',
  ground_frost: 'frost',
  snow: 'snow',
  strong_wind: 'wind',
  high_waves: 'sea',
  cyclone: 'cyclone',
  flood: 'flood',
  no_warning: null,
});

export const HAZARDS = Object.freeze(Object.keys(HAZARD_GROUP));

/** Group for an official hazard id; tips already use group names. */
export function hazardGroup(hazard) {
  if (!hazard) return null;
  return Object.prototype.hasOwnProperty.call(HAZARD_GROUP, hazard) ? HAZARD_GROUP[hazard] : hazard;
}

/** IMD colour levels. */
export const LEVELS = Object.freeze({ 1: 'green', 2: 'yellow', 3: 'orange', 4: 'red' });

export function levelName(level) {
  return LEVELS[level] || null;
}

/**
 * Groups with an official-advice row (PRD section 6.5). i18n keys are
 * officialAdvice.<group>.<levelName>.
 */
export const ADVICE_GROUPS = Object.freeze([
  'rain_heavy',
  'thunder',
  'heat',
  'cold',
  'fog',
  'dust',
  'cyclone',
  'sea',
]);
