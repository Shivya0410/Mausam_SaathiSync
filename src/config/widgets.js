/**
 * Homepage widget registry (PRD sections 5.7, 5.8 and Appendix E).
 *
 * Plain data so the ranking engine and the Settings layout page can use it
 * and tests can check it. Components are resolved by name through a map in
 * src/components/widgets/index.js (Part 2). Labels are i18n keys.
 *
 * `personas` are 0 to 100 weights (Appendix E, starting values; tune after
 * testing). `seasons` and `timeOfDay` are multipliers (default 1).
 */

const PERSONA_ORDER = ['health', 'fitness', 'coast', 'fisher', 'travel', 'family', 'farm', 'commute', 'events', 'work', 'citizen'];

// id: [weights in PERSONA_ORDER]
const WEIGHTS = {
  aqi: [100, 70, 20, 0, 30, 80, 30, 30, 60, 60, 60],
  bestTimeOut: [95, 40, 0, 0, 0, 70, 0, 0, 0, 0, 50],
  uv: [85, 65, 80, 30, 30, 40, 30, 10, 40, 40, 30],
  humidityHeat: [80, 60, 30, 20, 20, 60, 40, 30, 50, 85, 40],
  allergyEstimate: [70, 20, 0, 0, 0, 30, 0, 0, 0, 0, 0],
  runWindow: [30, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  sunTimes: [30, 80, 60, 60, 20, 10, 30, 0, 50, 0, 40],
  wind: [10, 60, 70, 90, 20, 0, 60, 20, 60, 20, 20],
  seaState: [0, 0, 100, 95, 20, 0, 0, 0, 0, 0, 0],
  tides: [0, 0, 90, 80, 0, 0, 0, 0, 0, 0, 0],
  waterTemp: [0, 0, 70, 20, 0, 0, 0, 0, 0, 0, 0],
  fisherWarning: [0, 0, 40, 100, 0, 0, 0, 0, 0, 0, 0],
  nextTrip: [0, 0, 0, 0, 100, 0, 0, 0, 0, 0, 0],
  savedPlaces: [10, 10, 20, 0, 90, 10, 10, 20, 10, 0, 40],
  flightWeather: [0, 0, 0, 0, 80, 0, 0, 20, 0, 0, 0],
  packingList: [0, 0, 0, 0, 70, 0, 0, 0, 0, 0, 0],
  schoolRun: [0, 0, 0, 0, 0, 100, 0, 0, 0, 0, 0],
  rainSoon: [40, 70, 60, 40, 30, 85, 70, 95, 60, 80, 70],
  rain5Day: [0, 0, 0, 30, 30, 0, 100, 0, 40, 0, 30],
  soil: [0, 0, 0, 0, 0, 0, 85, 0, 0, 0, 0],
  sprayWindow: [0, 0, 0, 0, 0, 0, 80, 0, 0, 0, 0],
  frostHail: [0, 0, 0, 0, 30, 0, 75, 0, 0, 0, 0],
  agromet: [0, 0, 0, 0, 0, 0, 90, 0, 0, 0, 0],
  plantingGuide: [0, 0, 0, 0, 0, 0, 50, 0, 0, 0, 0],
  commuteNow: [0, 0, 0, 0, 0, 0, 0, 100, 0, 0, 0],
  visibility: [20, 20, 0, 0, 70, 40, 0, 85, 0, 30, 30],
  waterlogging: [0, 0, 0, 0, 0, 60, 0, 90, 0, 70, 30],
  eventComfort: [0, 20, 0, 0, 0, 0, 0, 0, 100, 0, 0],
  heatDanger: [60, 50, 0, 0, 0, 60, 50, 40, 30, 100, 40],
  lightning: [40, 80, 80, 90, 30, 70, 90, 60, 60, 90, 50],
  coolSpots: [30, 0, 0, 0, 0, 20, 0, 0, 0, 80, 20],
  hourly: [70, 75, 70, 70, 50, 70, 60, 75, 50, 75, 90],
  daily: [50, 50, 50, 80, 80, 50, 80, 50, 80, 50, 85],
  mapTeaser: [20, 10, 20, 20, 20, 20, 20, 50, 20, 30, 50],
  readyStreak: [20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
};

// Context multipliers. Seasons: winter, summer, monsoon, postMonsoon.
// Time of day: morning, afternoon, evening, night.
const SEASON = {
  airSeason: { winter: 1.4, summer: 1.0, monsoon: 0.6, postMonsoon: 1.3 },
  heatSeason: { winter: 0.5, summer: 1.4, monsoon: 1.0, postMonsoon: 0.8 },
  rainSeason: { winter: 0.7, summer: 0.9, monsoon: 1.4, postMonsoon: 1.1 },
  fogSeason: { winter: 1.5, summer: 0.6, monsoon: 0.7, postMonsoon: 1.1 },
  frostSeason: { winter: 1.5, summer: 0.3, monsoon: 0.3, postMonsoon: 1.0 },
  stormSeason: { winter: 0.7, summer: 1.3, monsoon: 1.3, postMonsoon: 1.0 },
  allergySeason: { winter: 0.9, summer: 1.2, monsoon: 0.8, postMonsoon: 1.2 },
};
const TOD = {
  morningFirst: { morning: 1.3, afternoon: 0.9, evening: 1.1, night: 1.0 },
  airDay: { morning: 1.2, afternoon: 1.0, evening: 1.1, night: 0.8 },
  midday: { morning: 1.1, afternoon: 1.2, evening: 0.8, night: 0.6 },
  commuteTimes: { morning: 1.3, afternoon: 0.9, evening: 1.3, night: 0.7 },
  fogHours: { morning: 1.3, afternoon: 0.7, evening: 1.0, night: 1.2 },
  nightPlanning: { morning: 1.0, afternoon: 0.9, evening: 1.1, night: 1.2 },
};

// id: [size mobile, size desktop, seasons, timeOfDay, data keys, hideable]
const META = {
  aqi: ['full', 'half', SEASON.airSeason, TOD.airDay, ['air']],
  bestTimeOut: ['full', 'half', SEASON.airSeason, TOD.morningFirst, ['hourly', 'air']],
  uv: ['half', 'third', SEASON.heatSeason, TOD.midday, ['hourly']],
  humidityHeat: ['half', 'third', SEASON.heatSeason, TOD.midday, ['hourly', 'warnings']],
  allergyEstimate: ['half', 'third', SEASON.allergySeason, null, ['air', 'hourly']],
  runWindow: ['full', 'half', null, TOD.morningFirst, ['hourly', 'air', 'sun']],
  sunTimes: ['half', 'third', null, TOD.morningFirst, ['sun']],
  wind: ['half', 'third', SEASON.stormSeason, null, ['hourly']],
  seaState: ['full', 'half', SEASON.rainSeason, TOD.morningFirst, ['marine', 'warnings']],
  tides: ['full', 'half', null, null, ['marine']],
  waterTemp: ['half', 'third', null, null, ['marine']],
  fisherWarning: ['full', 'full', null, TOD.morningFirst, ['warnings', 'marine']],
  nextTrip: ['full', 'half', null, null, ['trips']],
  savedPlaces: ['full', 'full', null, null, ['places']],
  flightWeather: ['half', 'half', SEASON.fogSeason, null, ['airport']],
  packingList: ['half', 'half', null, TOD.nightPlanning, ['trips']],
  schoolRun: ['full', 'half', null, TOD.commuteTimes, ['hourly', 'air']],
  rainSoon: ['full', 'half', SEASON.rainSeason, null, ['hourly']],
  rain5Day: ['full', 'half', SEASON.rainSeason, null, ['daily']],
  soil: ['half', 'third', null, null, ['hourly']],
  sprayWindow: ['half', 'third', null, TOD.morningFirst, ['hourly']],
  frostHail: ['half', 'third', SEASON.frostSeason, TOD.nightPlanning, ['daily', 'hourly']],
  agromet: ['full', 'half', null, null, ['agromet']],
  plantingGuide: ['half', 'third', null, null, []],
  commuteNow: ['full', 'half', SEASON.rainSeason, TOD.commuteTimes, ['hourly', 'reports']],
  visibility: ['half', 'third', SEASON.fogSeason, TOD.fogHours, ['hourly', 'warnings']],
  waterlogging: ['full', 'half', { winter: 0.3, summer: 0.5, monsoon: 1.5, postMonsoon: 1.0 }, null, ['reports']],
  eventComfort: ['full', 'half', null, null, ['daily', 'events']],
  heatDanger: ['full', 'half', SEASON.heatSeason, TOD.midday, ['hourly', 'warnings']],
  lightning: ['half', 'third', SEASON.stormSeason, null, ['hourly', 'warnings']],
  coolSpots: ['half', 'half', SEASON.heatSeason, TOD.midday, []],
  hourly: ['full', 'full', null, null, ['hourly']],
  daily: ['full', 'full', null, null, ['daily']],
  mapTeaser: ['full', 'half', null, null, ['warnings', 'reports']],
  readyStreak: ['half', 'third', null, null, []],
};

/** Widgets whose data can carry an official warning, by hazard group (for urgency). */
export const WIDGET_HAZARDS = {
  aqi: ['air', 'dust'],
  humidityHeat: ['heat'],
  heatDanger: ['heat'],
  rainSoon: ['rain_heavy'],
  rain5Day: ['rain_heavy'],
  visibility: ['fog'],
  lightning: ['thunder', 'thunder_now'],
  seaState: ['sea', 'cyclone'],
  fisherWarning: ['sea', 'cyclone', 'sea_fisher'],
  frostHail: ['frost', 'hail'],
  commuteNow: ['rain_heavy', 'fog'],
  waterlogging: ['flood'],
  wind: ['wind', 'cyclone'],
};

const componentName = (id) => `${id.charAt(0).toUpperCase()}${id.slice(1)}Widget`;

export const WIDGETS = Object.keys(WEIGHTS).map((id) => {
  const [mobile, desktop, seasons, timeOfDay, data] = META[id];
  return {
    id,
    component: componentName(id),
    titleKey: `widgets.${id}.title`,
    size: { mobile, desktop },
    personas: Object.fromEntries(PERSONA_ORDER.map((p, i) => [p, WEIGHTS[id][i]])),
    seasons: seasons || {},
    timeOfDay: timeOfDay || {},
    data,
    hideable: true,
  };
});

export const WIDGET_IDS = WIDGETS.map((w) => w.id);

/** Rain widgets get an extra boost during the northeast monsoon in the south (PRD 5.11). */
export const RAIN_WIDGETS = ['rainSoon', 'rain5Day', 'waterlogging', 'commuteNow'];
