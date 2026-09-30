// Sun and moon times (PRD 12.2.6) from SunCalc: offline, labelled
// "Calculated". Times are ISO strings in the place's offset.

import SunCalc from 'suncalc';
import { isoAt } from './time.js';

const iso = (d, offsetMin) => (d instanceof Date && !Number.isNaN(d.getTime()) ? isoAt(d.getTime(), offsetMin) : null);

/**
 * @param {number} lat
 * @param {number} lon
 * @param {Date|number} date any instant on the local day of interest
 * @param {number} offsetMin place UTC offset
 */
export function sunTimes(lat, lon, date, offsetMin = 330) {
  // Noon local on that day keeps SunCalc on the right calendar date.
  const d = new Date(typeof date === 'number' ? date : date.getTime());
  const t = SunCalc.getTimes(d, lat, lon);
  const moon = SunCalc.getMoonIllumination(d);
  return {
    sunrise: iso(t.sunrise, offsetMin),
    sunset: iso(t.sunset, offsetMin),
    dawn: iso(t.dawn, offsetMin),
    dusk: iso(t.dusk, offsetMin),
    goldenHour: iso(t.goldenHour, offsetMin),
    goldenHourEnd: iso(t.goldenHourEnd, offsetMin),
    solarNoon: iso(t.solarNoon, offsetMin),
    dayLengthMin:
      t.sunrise instanceof Date && t.sunset instanceof Date ? Math.round((t.sunset - t.sunrise) / 60000) : null,
    moonPhase: Math.round(moon.phase * 100) / 100,
    moonIllumination: Math.round(moon.fraction * 100) / 100,
    source: 'calculated',
  };
}
