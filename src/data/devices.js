// Wearables and apps a workout can be recorded with. Used by the community
// feed, personal bests and active calories to say where a number came from.
// `icon` is a Font Awesome 6 class; brands without a Font Awesome glyph use a
// generic one.

export const DEVICES = {
  'apple-watch': { label: 'Apple Watch', icon: 'fa-brands fa-apple', color: '#111827' },
  whoop: { label: 'WHOOP', icon: 'fa-solid fa-heart-pulse', color: '#0f766e' },
  strava: { label: 'Strava', icon: 'fa-brands fa-strava', color: '#fc4c02' },
  garmin: { label: 'Garmin', icon: 'fa-solid fa-stopwatch', color: '#1d4ed8' },
  fitbit: { label: 'Fitbit', icon: 'fa-solid fa-heart', color: '#0e7490' },
  'google-fit': { label: 'Google Fit', icon: 'fa-brands fa-google', color: '#16a34a' },
  ultrahuman: { label: 'Ultrahuman Ring', icon: 'fa-solid fa-ring', color: '#6b21a8' },
  noise: { label: 'Noise ColorFit', icon: 'fa-solid fa-clock', color: '#be185d' },
  healthifyme: { label: 'HealthifyMe', icon: 'fa-solid fa-apple-whole', color: '#15803d' },
  swasth: { label: 'Swasth AI Coach', icon: 'fa-solid fa-dumbbell', color: '#6a1b9a' },
};

export function device(id) {
  return DEVICES[id] || { label: id, icon: 'fa-solid fa-mobile-screen', color: '#493971' };
}
