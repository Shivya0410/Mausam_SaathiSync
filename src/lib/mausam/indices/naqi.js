// Indian National AQI (CPCB) from pollutant concentrations (PRD section
// 6.6.2 and Appendix A.3). Pure.
//
// VERIFY every breakpoint against CPCB's National AQI document before
// release. The upper end of the Severe band is not a published breakpoint;
// the values used here only shape interpolation up to the 500 cap.

export const AQI_BANDS = Object.freeze([
  { lo: 0, hi: 50, category: 'good' },
  { lo: 51, hi: 100, category: 'satisfactory' },
  { lo: 101, hi: 200, category: 'moderate' },
  { lo: 201, hi: 300, category: 'poor' },
  { lo: 301, hi: 400, category: 'very_poor' },
  { lo: 401, hi: 500, category: 'severe' },
]);

export const AQI_CATEGORIES = Object.freeze(AQI_BANDS.map((b) => b.category));

// Concentration breakpoints per band. µg/m³ except CO (mg/m³).
// `decimals` is the precision concentrations are rounded to before lookup,
// which closes the gaps between bands (60.4 -> 60, 1.04 -> 1.0).
const BP = {
  pm2_5: { decimals: 0, bands: [[0, 30], [31, 60], [61, 90], [91, 120], [121, 250], [251, 380]] },
  pm10: { decimals: 0, bands: [[0, 50], [51, 100], [101, 250], [251, 350], [351, 430], [431, 510]] },
  no2: { decimals: 0, bands: [[0, 40], [41, 80], [81, 180], [181, 280], [281, 400], [401, 800]] },
  o3: { decimals: 0, bands: [[0, 50], [51, 100], [101, 168], [169, 208], [209, 748], [749, 1000]] },
  co: { decimals: 1, bands: [[0, 1.0], [1.1, 2.0], [2.1, 10], [10.1, 17], [17.1, 34], [34.1, 50]] },
  so2: { decimals: 0, bands: [[0, 40], [41, 80], [81, 380], [381, 800], [801, 1600], [1601, 2400]] },
  nh3: { decimals: 0, bands: [[0, 200], [201, 400], [401, 800], [801, 1200], [1201, 1800], [1801, 2400]] },
};

export const POLLUTANTS = Object.freeze(Object.keys(BP));

/** Sub-index for one pollutant concentration. Null for unknown input. */
export function subIndex(pollutant, c) {
  const table = BP[pollutant];
  if (!table || !Number.isFinite(c) || c < 0) return null;
  const f = 10 ** table.decimals;
  const value = Math.round(c * f) / f;
  for (let i = 0; i < table.bands.length; i++) {
    const [bpLo, bpHi] = table.bands[i];
    if (value <= bpHi) {
      const { lo, hi } = AQI_BANDS[i];
      return Math.round(((hi - lo) / (bpHi - bpLo)) * (value - bpLo) + lo);
    }
  }
  return 500;
}

export function categoryOf(aqi) {
  if (aqi == null || !Number.isFinite(aqi)) return null;
  return (AQI_BANDS.find((b) => aqi <= b.hi) || AQI_BANDS[AQI_BANDS.length - 1]).category;
}

/**
 * AQI from 24 h mean PM2.5 and PM10 (model data). Returns
 * { aqi, category, dominant } or null when neither is available.
 */
export function naqiFromPm({ pm25, pm10 } = {}) {
  return naqiFromPollutants({ pm2_5: pm25, pm10 }, { minPollutants: 1 });
}

/**
 * AQI as the maximum sub-index across pollutants. CPCB requires at least
 * three pollutants, one of them PM2.5 or PM10, for a station AQI; pass
 * { minPollutants: 3 } to enforce that for station data.
 */
export function naqiFromPollutants(concentrations = {}, { minPollutants = 1 } = {}) {
  const subs = Object.entries(concentrations)
    .map(([p, c]) => [p, subIndex(p, c)])
    .filter(([, v]) => v != null);
  if (subs.length < minPollutants) return null;
  if (minPollutants >= 3 && !subs.some(([p]) => p === 'pm2_5' || p === 'pm10')) return null;
  if (!subs.length) return null;
  const [dominant, aqi] = subs.reduce((a, b) => (b[1] > a[1] ? b : a));
  const capped = Math.min(500, aqi);
  return { aqi: capped, category: categoryOf(capped), dominant };
}

/** Trailing mean over `hours` records ending at endIndex, of { value }. */
export function trailingMean(hourly, endIndex, hours = 24) {
  const start = Math.max(0, endIndex - hours + 1);
  const slice = hourly
    .slice(start, endIndex + 1)
    .map((h) => h.value)
    .filter(Number.isFinite);
  return slice.length ? slice.reduce((s, v) => s + v, 0) / slice.length : null;
}

/** Penalty used by the Run Score and Comfort Index (PRD 6.6.3). */
export function aqiPenalty(aqi) {
  if (!Number.isFinite(aqi)) return 0;
  if (aqi <= 50) return 0;
  if (aqi <= 100) return 5;
  if (aqi <= 200) return 15;
  if (aqi <= 300) return 35;
  return 60;
}
