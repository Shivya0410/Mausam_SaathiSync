// Heat index, wind chill and "feels like" (PRD section 6.6.1). Pure.

/** Heat index in °C (NOAA Rothfusz), applied only at or above 27°C and 40% RH. */
export function heatIndexC(tC, rh) {
  if (!Number.isFinite(tC) || !Number.isFinite(rh)) return null;
  if (tC < 27 || rh < 40) return tC;
  const T = (tC * 9) / 5 + 32;
  let HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * rh -
    0.22475541 * T * rh -
    0.00683783 * T * T -
    0.05481717 * rh * rh +
    0.00122874 * T * T * rh +
    0.00085282 * T * rh * rh -
    0.00000199 * T * T * rh * rh;
  if (rh < 13 && T >= 80 && T <= 112) HI -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  if (rh > 85 && T >= 80 && T <= 87) HI += ((rh - 85) / 10) * ((87 - T) / 5);
  return Math.round((((HI - 32) * 5) / 9) * 10) / 10;
}

/** Wind chill in °C (Environment Canada / NWS), valid at or below 10°C and above 4.8 km/h. */
export function windChillC(tC, windKmh) {
  if (!Number.isFinite(tC) || !Number.isFinite(windKmh)) return null;
  if (tC > 10 || windKmh <= 4.8) return tC;
  const v = windKmh ** 0.16;
  return Math.round((13.12 + 0.6215 * tC - 11.37 * v + 0.3965 * tC * v) * 10) / 10;
}

/**
 * One "feels like" number (PRD 6.6.1): IMD heat index when available, else
 * the computed heat index when it applies, else the model's apparent
 * temperature, else the air temperature.
 */
export function feelsLikeC({ tempC, rh, apparentC, imdHeatIndexC } = {}) {
  if (Number.isFinite(imdHeatIndexC)) return imdHeatIndexC;
  if (Number.isFinite(tempC) && Number.isFinite(rh) && tempC >= 27 && rh >= 40) {
    return heatIndexC(tempC, rh);
  }
  if (Number.isFinite(apparentC)) return Math.round(apparentC * 10) / 10;
  return Number.isFinite(tempC) ? tempC : null;
}

/** Heat index bands (US NWS-derived, used for tips only; Appendix A.2). */
export function heatBand(hi) {
  if (hi == null || !Number.isFinite(hi)) return null;
  if (hi < 27) return 'comfortable';
  if (hi < 32) return 'caution';
  if (hi < 41) return 'extreme_caution';
  if (hi <= 54) return 'danger';
  return 'extreme_danger';
}

/** Display cap (PRD edge case E25): never show above 60°C; label "Extreme". */
export function displayHeat(hi) {
  if (!Number.isFinite(hi)) return { value: null, extreme: false };
  return hi > 60 ? { value: 60, extreme: true } : { value: Math.round(hi), extreme: false };
}
