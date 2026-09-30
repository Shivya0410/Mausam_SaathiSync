// WMO weather codes (returned by Open-Meteo) to icon and text key
// (PRD Appendix B). Text lives in i18n under wmo.<code>. Pure.

const MAP = {
  0: { icon: 'clear', day: true },
  1: { icon: 'partly', day: true },
  2: { icon: 'partly', day: true },
  3: { icon: 'cloudy' },
  45: { icon: 'fog' },
  48: { icon: 'fog' },
  51: { icon: 'drizzle' },
  53: { icon: 'drizzle' },
  55: { icon: 'drizzle' },
  56: { icon: 'drizzle' },
  57: { icon: 'drizzle' },
  61: { icon: 'rain' },
  63: { icon: 'rain' },
  65: { icon: 'heavy-rain' },
  66: { icon: 'rain' },
  67: { icon: 'rain' },
  71: { icon: 'snow' },
  73: { icon: 'snow' },
  75: { icon: 'snow' },
  77: { icon: 'snow' },
  80: { icon: 'rain' },
  81: { icon: 'rain' },
  82: { icon: 'heavy-rain' },
  85: { icon: 'snow' },
  86: { icon: 'snow' },
  95: { icon: 'thunder' },
  96: { icon: 'thunder-hail' },
  99: { icon: 'thunder-hail' },
};

export const WMO_CODES = Object.freeze(Object.keys(MAP).map(Number));

/**
 * @param {number} code
 * @param {boolean} [isDay=true]
 * @returns {{ code: number, textKey: string, icon: string } | null}
 */
export function wmoInfo(code, isDay = true) {
  const entry = MAP[code];
  if (!entry) return null;
  const icon = entry.day ? `${entry.icon}-${isDay ? 'day' : 'night'}` : entry.icon;
  return { code, textKey: `wmo.${code}`, icon };
}

export const isThunderCode = (code) => code === 95 || code === 96 || code === 99;
export const isHailCode = (code) => code === 96 || code === 99;
export const isFogCode = (code) => code === 45 || code === 48;

/** Rough severity for choosing a day's dominant condition. */
export function wmoWeight(code) {
  if (isThunderCode(code)) return 6;
  if (code === 65 || code === 82) return 5;
  if (code >= 61 && code <= 67) return 4;
  if (code >= 80) return 4;
  if (code >= 71 && code <= 77) return 4;
  if (code >= 51 && code <= 57) return 3;
  if (isFogCode(code)) return 3;
  if (code === 3) return 2;
  if (code === 1 || code === 2) return 1;
  return 0;
}
