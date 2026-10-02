// Dynamic weather-state helper: maps live API values to one of the nine
// design-system states (sunny/hot, cloudy, rainy, thunderstorm, foggy,
// cold/winter, night, poor AQI, extreme alert). Pure and fully dynamic —
// no city, temperature or condition is ever hardcoded.

import { isThunderCode, isFogCode, isRainCode, isSnowCode, isDrizzleCode } from './wmo.js';

export const WEATHER_STATES = Object.freeze([
  'alert',
  'storm',
  'rain',
  'fog',
  'snow',
  'heat',
  'poor-aqi',
  'night',
  'cloudy',
  'sunny',
]);

/**
 * @param {object} a
 * @param {number} [a.wmo] WMO weather code from the forecast API
 * @param {boolean} [a.isDay=true] from the forecast API
 * @param {number} [a.tempC] current temperature (°C, API value)
 * @param {number} [a.feelsC] feels-like (°C, API value)
 * @param {number} [a.aqi] National AQI (API value)
 * @param {number} [a.warningLevel=1] highest official warning level 1-4
 * @returns {'alert'|'storm'|'rain'|'fog'|'snow'|'heat'|'poor-aqi'|'night'|'cloudy'|'sunny'}
 */
export function weatherStateFor({ wmo, isDay = true, tempC, feelsC, aqi, warningLevel = 1 } = {}) {
  if (warningLevel >= 4 || warningLevel === 3) return 'alert';
  if (isThunderCode(wmo)) return 'storm';
  if (wmo === 65 || wmo === 82) return 'rain';
  if (isRainCode(wmo) || isDrizzleCode(wmo)) return 'rain';
  if (isFogCode(wmo)) return 'fog';
  if (isSnowCode(wmo)) return 'snow';
  if ((Number.isFinite(tempC) && tempC >= 38) || (Number.isFinite(feelsC) && feelsC >= 42)) return 'heat';
  if (Number.isFinite(aqi) && aqi >= 201) return 'poor-aqi';
  if (!isDay) return 'night';
  if (wmo === 2 || wmo === 3) return 'cloudy';
  return 'sunny';
}

/** Time-of-day greeting key from the place's local hour (dynamic). */
export function timeOfDayKey(hour) {
  if (hour >= 4 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
