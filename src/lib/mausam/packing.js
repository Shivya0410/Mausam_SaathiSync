// Packing list for a trip (PRD section 6.6.11). Pure.
//
// Each item says why it was suggested, so the list is explainable
// ("Rain on 2 of 4 days").

import { T } from './thresholds.js';

/**
 * @param {object} trip
 * @param {Array} trip.days daily forecast (or climatology) for trip dates:
 *   { date, minC, maxC, precipProbMax, uvMax, aqi? }
 * @param {boolean} [trip.coastal]
 * @param {number} [trip.elevationM]
 * @returns {Array<{ id: string, reason: string, params?: object }>}
 */
export function packingList({ days = [], coastal = false, elevationM = 0 } = {}) {
  const items = [];
  const add = (id, reason, params) => {
    if (!items.some((i) => i.id === id)) items.push({ id, reason, ...(params ? { params } : {}) });
  };
  const n = days.length;
  const rainyDays = days.filter((d) => (d.precipProbMax ?? 0) >= 50).length;
  const minC = Math.min(...days.map((d) => d.minC ?? Infinity));
  const maxC = Math.max(...days.map((d) => d.maxC ?? -Infinity));
  const uvMax = Math.max(...days.map((d) => d.uvMax ?? 0));
  const aqiMax = Math.max(...days.map((d) => d.aqi ?? 0));

  if (rainyDays >= 1) add('umbrella', 'rainDays', { n: rainyDays, total: n });
  if (rainyDays >= 3) add('waterproofShoes', 'rainDays', { n: rainyDays, total: n });

  if (minC < 15) add('warmLayer', 'cold', { minC });
  if (minC < 8) {
    add('jacket', 'cold', { minC });
    add('cap', 'cold', { minC });
    add('gloves', 'cold', { minC });
  }
  if (minC < 0) add('thermals', 'freezing', { minC });

  if (maxC > 32) {
    add('cottonClothes', 'hot', { maxC });
    add('cap', 'hot', { maxC });
  }
  if (uvMax >= 7) {
    add('sunscreen', 'uv', { uv: uvMax });
    add('sunglasses', 'uv', { uv: uvMax });
  }
  if (coastal) {
    add('swimwear', 'coastal');
    add('flipFlops', 'coastal');
  }
  if (elevationM > 1500) add('layers', 'hills', { elevationM });
  if (aqiMax >= T.aqi.poor) add('mask', 'air', { aqi: aqiMax });

  add('powerBank', 'always');
  add('medicines', 'always');
  add('waterBottle', 'always');
  return items;
}
