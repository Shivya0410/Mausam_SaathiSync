// IMD code tables, from the public IMD API reference
// (https://api.imd.gov.in/public/api_reference.html, read 30 Sep 2026).
//
// Careful: the two APIs number colours in OPPOSITE directions.
//   District warnings (districtwarning): Day colour 1 = Red, 2 = Orange,
//     3 = Yellow, 4 = Green.
//   Nowcasts (districtnowcast, stationnowcast): colour 1 = Green,
//     2 = Yellow, 3 = Orange, 4 = Red.
// Our levels are always 1 green, 2 yellow, 3 orange, 4 red.

/** District warning codes (Day_1 ... Day_5, comma separated) to hazard ids. */
export const DISTRICT_WARNING_CODES = Object.freeze({
  1: 'no_warning',
  2: 'heavy_rain',
  3: 'snow',
  4: 'thunderstorm',
  5: 'hailstorm',
  6: 'dust_storm',
  7: 'dust_storm', // dust raising winds
  8: 'strong_wind',
  9: 'heat_wave',
  10: 'heat_wave', // hot day
  11: 'warm_night',
  12: 'cold_wave',
  13: 'cold_day',
  14: 'ground_frost',
  15: 'dense_fog',
  16: 'very_heavy_rain',
  17: 'extremely_heavy_rain',
});

/** District warning day colour (1 red ... 4 green) to our level. */
export function districtColourToLevel(colour) {
  const map = { 1: 4, 2: 3, 3: 2, 4: 1 };
  return map[Number(colour)] ?? null;
}

/** Nowcast colour (1 green ... 4 red) to our level. */
export function nowcastColourToLevel(colour) {
  const n = Number(colour);
  return n >= 1 && n <= 4 ? n : null;
}

/**
 * Nowcast category numbers to hazards. Cat16 is free text, so it has no
 * number here. Rain categories map to heavy_rain only for Cat12 (> 15 mm/h).
 */
export const NOWCAST_CATEGORIES = Object.freeze({
  2: 'light_rain',
  3: 'snow',
  4: 'thunderstorm',
  5: 'dust_storm',
  6: 'lightning',
  7: 'moderate_rain',
  8: 'snow',
  9: 'thunderstorm',
  10: 'dust_storm',
  11: 'lightning',
  12: 'heavy_rain',
  13: 'snow',
  14: 'thunderstorm',
  15: 'thunderstorm',
  31: 'hailstorm',
  32: 'dust_storm',
  33: 'lightning',
});

/** Most important hazard among nowcast categories present. */
export function nowcastHazard(cats) {
  const priority = ['thunderstorm', 'hailstorm', 'lightning', 'dust_storm', 'heavy_rain', 'snow', 'moderate_rain', 'light_rain'];
  const hazards = cats.map((c) => NOWCAST_CATEGORIES[c]).filter(Boolean);
  return priority.find((h) => hazards.includes(h)) || null;
}
