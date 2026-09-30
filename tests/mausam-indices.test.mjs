import test from 'node:test';
import assert from 'node:assert/strict';

import { heatIndexC, feelsLikeC, heatBand, windChillC, displayHeat } from '../src/lib/mausam/indices/heatIndex.js';
import { subIndex, categoryOf, naqiFromPm, naqiFromPollutants, trailingMean, aqiPenalty } from '../src/lib/mausam/indices/naqi.js';
import { uvCategory } from '../src/lib/mausam/indices/uv.js';
import { scoreHour, bestRunWindow, topFactors } from '../src/lib/mausam/indices/runScore.js';
import { comfortIndex, comfortBand } from '../src/lib/mausam/indices/comfortIndex.js';
import { sprayWindow, frostRisk, soilWord, rainfallCategory } from '../src/lib/mausam/indices/farm.js';
import { allergyEstimate } from '../src/lib/mausam/indices/allergyEstimate.js';
import { seaVerdict, fisherVerdict, tideExtrema, seaStateWord, waterTempWord } from '../src/lib/mausam/indices/seaSafety.js';
import { endOfHour } from '../src/lib/mausam/indices/windows.js';
import { packingList } from '../src/lib/mausam/packing.js';
import { leaveVerdict, rainSpans, trafficLink } from '../src/lib/mausam/commute.js';
import { seasonFor, seasonOfMonth } from '../src/lib/mausam/season.js';
import { timeOfDay, localParts, isoAt, nextClockTime, sliceHours, addDays, daysBetween } from '../src/lib/mausam/time.js';
import { wmoInfo, wmoWeight } from '../src/lib/mausam/wmo.js';
import { haversineKm, pointToSegmentKm, compass8, roundToGrid } from '../src/lib/mausam/geo.js';
import { hazardGroup } from '../src/lib/mausam/hazards.js';
import { summarize, greetingKey } from '../src/lib/mausam/summary.js';
import { at, DATE, hours, snapshot } from './helpers/weather.mjs';

// ── Heat index (PRD 6.6.1, 27.2) ──
test('heat index matches the worked examples', () => {
  assert.ok(Math.abs(heatIndexC(32, 70) - 40.7) <= 0.5, `got ${heatIndexC(32, 70)}`);
  assert.equal(heatIndexC(26, 90), 26);
  assert.equal(heatIndexC(40, 30), 40);
  assert.equal(heatIndexC(NaN, 50), null);
  assert.equal(heatBand(45), 'danger');
  assert.equal(heatBand(20), 'comfortable');
  assert.equal(heatBand(58), 'extreme_danger');
});

test('feels-like prefers IMD, then heat index, then apparent temperature', () => {
  assert.equal(feelsLikeC({ tempC: 35, rh: 60, apparentC: 39, imdHeatIndexC: 44 }), 44);
  assert.equal(feelsLikeC({ tempC: 32, rh: 70, apparentC: 38 }), heatIndexC(32, 70));
  assert.equal(feelsLikeC({ tempC: 20, rh: 70, apparentC: 19.46 }), 19.5);
  assert.equal(feelsLikeC({ tempC: 20, rh: 70 }), 20);
});

test('wind chill applies only when cold and windy; display caps at 60°C', () => {
  assert.ok(windChillC(5, 20) < 5);
  assert.equal(windChillC(15, 20), 15);
  assert.deepEqual(displayHeat(63), { value: 60, extreme: true });
  assert.deepEqual(displayHeat(41.4), { value: 41, extreme: false });
});

// ── National AQI (PRD 6.6.2, T1.2) ──
test('NAQI sub-indices from PM (T1.2 acceptance)', () => {
  assert.equal(subIndex('pm2_5', 45), 75);
  assert.equal(categoryOf(subIndex('pm2_5', 45)), 'satisfactory');
  assert.equal(subIndex('pm10', 300), 250);
  assert.equal(categoryOf(250), 'poor');
  assert.equal(subIndex('pm2_5', 0), 0);
  assert.equal(subIndex('pm2_5', 1000), 500);
  assert.equal(subIndex('pm2_5', -1), null);
  assert.equal(subIndex('unknown', 10), null);
});

test('NAQI takes the maximum sub-index and names the dominant pollutant', () => {
  const r = naqiFromPm({ pm25: 45, pm10: 300 });
  assert.deepEqual(r, { aqi: 250, category: 'poor', dominant: 'pm10' });
  assert.equal(naqiFromPm({}), null);
  assert.equal(naqiFromPm({ pm25: 900 }).aqi, 500);
});

test('station AQI needs three pollutants including PM (CPCB rule)', () => {
  assert.equal(naqiFromPollutants({ pm2_5: 50, no2: 30 }, { minPollutants: 3 }), null);
  assert.equal(naqiFromPollutants({ no2: 30, so2: 20, o3: 40 }, { minPollutants: 3 }), null);
  const ok = naqiFromPollutants({ pm2_5: 50, no2: 30, co: 1.5 }, { minPollutants: 3 });
  assert.equal(ok.dominant, 'pm2_5');
  assert.equal(subIndex('co', 1.04), 50);
});

test('AQI categories cover every band edge', () => {
  assert.deepEqual([50, 51, 100, 101, 200, 201, 300, 301, 400, 401, 500].map(categoryOf), [
    'good', 'satisfactory', 'satisfactory', 'moderate', 'moderate', 'poor', 'poor', 'very_poor', 'very_poor', 'severe', 'severe',
  ]);
  assert.equal(trailingMean([{ value: 10 }, { value: 20 }, { value: null }], 2, 24), 15);
  assert.deepEqual([40, 90, 150, 250, 350].map(aqiPenalty), [0, 5, 15, 35, 60]);
});

test('UV categories (WHO)', () => {
  assert.deepEqual([1, 4, 7, 9, 12].map(uvCategory), ['low', 'moderate', 'high', 'very_high', 'extreme']);
});

// ── Run Score (PRD 6.6.3, matrix rows 35 and 36) ──
test('matrix 35: run score for HI 30, AQI 60, calm daylight = 83', () => {
  const r = scoreHour({ feelsC: 30, aqi: 60, precipProb: 0, precipMm: 0, gustKmh: 10, uv: 2, isDay: true, wmo: 1 });
  assert.equal(r.score, 83);
  assert.deepEqual(topFactors(r.penalties), ['heat', 'air']);
});

test('matrix 36: thunderstorm hour scores 0 and is unsafe', () => {
  const r = scoreHour({ feelsC: 25, wmo: 95, isDay: true });
  assert.equal(r.score, 0);
  assert.equal(r.unsafe, true);
  assert.equal(scoreHour({ feelsC: 42, isDay: true, wmo: 1 }).unsafe, true);
});

test('cyclists feel wind more; night runners have no dark penalty', () => {
  const h = { feelsC: 22, gustKmh: 30, isDay: true, wmo: 1 };
  assert.ok(scoreHour(h, { activity: 'cycle' }).score < scoreHour(h, { activity: 'run' }).score);
  const dark = { feelsC: 22, isDay: false, wmo: 1 };
  assert.equal(scoreHour(dark, { nightOk: true }).score - scoreHour(dark).score, 15);
});

test('best run window widens over near-equal neighbours and falls back outside the band', () => {
  const hs = hours({ days: 2, patch: (h, hr) => (hr === 5 ? { feelsC: 28, isDay: true } : hr === 6 ? { feelsC: 26 } : { feelsC: 38 }) })
    .filter((h) => h.time >= at(DATE, 0));
  const w = bestRunWindow(hs, { band: 'early_morning', durationMin: 60 });
  assert.equal(w.start, at(DATE, 5));
  assert.equal(w.end, at(DATE, 7));
  assert.equal(w.outsideBand, false);
  const allHot = hs.map((h) => ({ ...h, feelsC: 45 }));
  assert.equal(bestRunWindow(allHot, { band: 'morning' }).none, true);
});

// ── Comfort Index (PRD 6.6.4, matrix 76 and 77) ──
test('matrix 76 and 77: comfort index bands', () => {
  const good = comfortIndex({ tempC: 20, hi: 20, rh: 50, precipProbMax: 0, gustMax: 15, aqi: 90 });
  assert.ok(good >= 90, `got ${good}`);
  assert.equal(comfortBand(good), 'excellent');
  const bad = comfortIndex({ tempC: 36, hi: 38, rh: 80, precipProbMax: 60, gustMax: 35 });
  assert.ok(bad < 40, `got ${bad}`);
  assert.equal(comfortBand(bad), 'poor');
  assert.equal(comfortIndex({ tempC: 10, hi: 10, rh: 50 }), 84); // 2 × (18 − 10) cold penalty
});

// ── Spray window (matrix 56 and 57) ──
function sprayHours(patch) {
  return hours({ days: 2, patch: (h, hr, date) => (date === DATE ? patch(hr) : { windKmh: 0 }) });
}

test('matrix 56: spray window 06:00 to 10:00', () => {
  const hs = sprayHours((hr) => (hr >= 6 && hr <= 9 ? { windKmh: 6, precipProb: 10, tempC: 26, rh: 70 } : { windKmh: 0, precipProb: 10, rh: 70 }));
  const w = sprayWindow(hs, DATE);
  assert.equal(w.start, at(DATE, 6));
  assert.equal(w.end, at(DATE, 10));
});

test('matrix 57: too windy all morning means no window', () => {
  const hs = sprayHours(() => ({ windKmh: 14, rh: 70 }));
  assert.equal(sprayWindow(hs, DATE), null);
});

test('spray window excludes hours with rain in the next 6 hours', () => {
  const hs = sprayHours((hr) => (hr === 12 ? { precipProb: 70, precipMm: 3, rh: 70 } : { windKmh: 6, rh: 70 }));
  const w = sprayWindow(hs, DATE);
  // 06:00 onwards sees the 12:00 rain within 6 h, so the morning block is
  // only 05:00; the evening block (16:00 to 19:00) is longer and wins.
  assert.equal(w.start, at(DATE, 16));
  assert.equal(w.end, at(DATE, 19));
});

// ── Frost (matrix 61 to 63) ──
test('frost risk bands', () => {
  assert.equal(frostRisk({ tminC: 1.5 }), 'high');
  assert.equal(frostRisk({ tminC: 3, cloudPct: 20, windKmh: 4 }), 'moderate');
  assert.equal(frostRisk({ tminC: 3, cloudPct: 80, windKmh: 4 }), 'low');
  assert.equal(frostRisk({ tminC: NaN }), null);
  assert.equal(soilWord(0.11), 'dry');
  assert.deepEqual([0, 2, 10, 50, 80, 150, 250].map(rainfallCategory), [
    'none', 'very_light', 'light', 'moderate', 'heavy', 'very_heavy', 'extremely_heavy',
  ]);
});

// ── Allergy estimate (matrix 28) ──
test('allergy estimate is a labelled heuristic', () => {
  assert.equal(allergyEstimate({ month: 3, pm10: 140, windKmh: 18, rh: 40 }).level, 'high');
  assert.equal(allergyEstimate({ month: 7, pm10: 30, windKmh: 5, rh: 90, rainingNow: true }).level, 'low');
  assert.equal(allergyEstimate({ month: 7, pm10: 80, windKmh: 12, rh: 80 }).level, 'moderate');
});

// ── Sea verdict (matrix 37 to 40) ──
test('matrix 37 to 40: sea safety verdicts', () => {
  assert.deepEqual(seaVerdict({ waveM: 2.2 }), { verdict: 'stay_out', reasons: ['waves'] });
  const caution = seaVerdict({ waveM: 1.1, swellPeriodS: 12, swellM: 0.8 });
  assert.equal(caution.verdict, 'caution');
  assert.ok(caution.reasons.includes('swell_period'));
  assert.deepEqual(seaVerdict({ swellM: 1.6, swellPeriodS: 13 }), { verdict: 'stay_out', reasons: ['long_swell'] });
  assert.deepEqual(seaVerdict({ officialWarning: true, waveM: 0.6 }), { verdict: 'stay_out', reasons: ['official'] });
  assert.equal(seaVerdict({ waveM: 0.5, windKmh: 10 }).verdict, 'safe');
  assert.equal(seaVerdict({ waveM: 0.5, nearLowTide: true, ripProne: true }).reasons[0], 'rip_low_tide');
});

test('fisher verdict follows official warnings first', () => {
  assert.deepEqual(fisherVerdict({ officialWarning: true, maxWindKmh: 5 }), { verdict: 'no_go', reason: 'official' });
  assert.equal(fisherVerdict({ maxWindKmh: 50 }).reason, 'wind');
  assert.equal(fisherVerdict({ maxWaveM: 2.6 }).reason, 'waves');
  assert.equal(fisherVerdict({ maxWindKmh: 10, maxWaveM: 0.5 }).verdict, 'go');
  assert.equal(seaStateWord(0.8), 'slight');
  assert.equal(waterTempWord(29), 'warm');
});

// ── Tides (matrix 44 and 45) ──
test('matrix 44: tide extrema from a semi-diurnal series', () => {
  const series = Array.from({ length: 26 }, (_, i) => ({
    time: i < 24 ? at(DATE, i) : at('2026-09-30', i - 24),
    seaLevelM: Math.sin(((i - 3) * Math.PI) / 6),
  }));
  const ex = tideExtrema(series);
  assert.equal(ex.length, 4);
  assert.deepEqual(ex.map((e) => e.type), ['high', 'low', 'high', 'low']);
  assert.equal(ex[0].time, at(DATE, 6));
});

test('matrix 45: missing sea level returns no tides (never guessed)', () => {
  assert.deepEqual(tideExtrema([{ time: at(DATE, 1), seaLevelM: null }, { time: at(DATE, 2), seaLevelM: null }]), []);
  assert.deepEqual(tideExtrema(null), []);
});

// ── Packing (matrix 49) ──
test('matrix 49: packing list for a cold, wet, sunny trip', () => {
  const trip = { days: [
    { minC: 7, maxC: 15, precipProbMax: 60, uvMax: 7 },
    { minC: 8, maxC: 16, precipProbMax: 65, uvMax: 6 },
    { minC: 9, maxC: 17, precipProbMax: 10, uvMax: 5 },
    { minC: 9, maxC: 17, precipProbMax: 20, uvMax: 5 },
  ] };
  const ids = packingList(trip).map((i) => i.id);
  for (const id of ['jacket', 'cap', 'gloves', 'umbrella', 'sunscreen', 'powerBank']) assert.ok(ids.includes(id), id);
  assert.ok(!ids.includes('waterproofShoes'));
  assert.equal(packingList(trip).find((i) => i.id === 'umbrella').params.n, 2);
  const beach = packingList({ days: [{ minC: 25, maxC: 34, precipProbMax: 0, uvMax: 10 }], coastal: true }).map((i) => i.id);
  assert.ok(beach.includes('swimwear') && beach.includes('cottonClothes'));
});

// ── Leave verdict (matrix 67 to 69) ──
const t = (hh, mm = 0) => Date.parse(at(DATE, hh, mm));
test('matrix 67: rain after arrival means leave on time', () => {
  const v = leaveVerdict({ now: t(8), departure: t(8, 30), travelMin: 45, spans: [{ start: t(10), end: t(12) }] });
  assert.equal(v.verdict, 'leave_on_time');
});
test('matrix 68: ongoing rain ending within an hour means wait', () => {
  const v = leaveVerdict({ now: t(8, 10), departure: t(8, 30), spans: [{ start: t(8), end: t(9) }] });
  assert.deepEqual(v, { verdict: 'wait_until', at: t(9) });
});
test('matrix 69: rain starting before departure means leave 15 minutes before it', () => {
  const v = leaveVerdict({ now: t(8), departure: t(9), spans: [{ start: t(8, 45), end: t(11) }] });
  assert.equal(v.verdict, 'leave_by');
  assert.equal(v.at, t(8, 30));
});
test('leave verdict: long rain means carry gear; no rain means no_rain', () => {
  assert.equal(leaveVerdict({ now: t(8), departure: t(8, 30), spans: [{ start: t(7), end: t(12) }] }).verdict, 'carry_gear');
  assert.equal(leaveVerdict({ now: t(8), departure: t(8, 30), spans: [] }).verdict, 'no_rain');
  const hs = hours({ patch: (h, hr, date) => (date === DATE && hr >= 9 && hr < 11 ? { precipProb: 70, precipMm: 2 } : null) });
  assert.deepEqual(rainSpans(hs), [{ start: t(9), end: t(11) }]);
  assert.match(trafficLink({ lat: 1, lon: 2 }, { lat: 3, lon: 4 }, 'public'), /travelmode=transit/);
});

// ── Season, time, WMO, geo, hazards ──
test('IMD seasons and the northeast monsoon boost', () => {
  assert.deepEqual([1, 3, 7, 11].map(seasonOfMonth), ['winter', 'summer', 'monsoon', 'postMonsoon']);
  assert.equal(seasonFor(11, 'Tamil Nadu').northeastMonsoon, true);
  assert.equal(seasonFor(11, 'Delhi').northeastMonsoon, false);
  assert.equal(seasonFor(7, 'Tamil Nadu').northeastMonsoon, false);
});

test('time helpers work in the place timezone, not the machine timezone', () => {
  assert.deepEqual([4, 11, 12, 17, 21, 3].map(timeOfDay), ['morning', 'morning', 'afternoon', 'evening', 'night', 'night']);
  const p = localParts(Date.parse('2026-09-29T20:00:00Z'), 330);
  assert.equal(p.date, '2026-09-30');
  assert.equal(p.hour, 1);
  assert.equal(isoAt(Date.parse('2026-09-29T20:00:00Z'), 330), '2026-09-30T01:30:00+05:30');
  assert.equal(nextClockTime('08:30', t(9), 330), Date.parse(at('2026-09-30', 8, 30)));
  assert.equal(nextClockTime('08:30', t(8, 45), 330, 30), t(8, 30));
  assert.equal(nextClockTime('25:00', t(9), 330), null);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(daysBetween('2026-09-29', '2026-10-05'), 6);
  assert.equal(endOfHour(at(DATE, 23)), at('2026-09-30', 0));
  assert.equal(sliceHours(hours(), t(10, 30), 2).length, 2);
});

test('WMO mapping, geo helpers and hazard groups', () => {
  assert.deepEqual(wmoInfo(0, false), { code: 0, textKey: 'wmo.0', icon: 'clear-night' });
  assert.equal(wmoInfo(96).icon, 'thunder-hail');
  assert.equal(wmoInfo(12345), null);
  assert.ok(wmoWeight(95) > wmoWeight(61));
  assert.ok(Math.abs(haversineKm({ lat: 28.61, lon: 77.21 }, { lat: 19.08, lon: 72.88 }) - 1153) < 10);
  assert.ok(pointToSegmentKm({ lat: 19.05, lon: 72.9 }, { lat: 19.0, lon: 72.9 }, { lat: 19.1, lon: 72.9 }) < 0.01);
  assert.equal(compass8(270), 'W');
  assert.equal(compass8(350), 'N');
  assert.equal(roundToGrid(19.0415), 19.0395);
  assert.equal(hazardGroup('very_heavy_rain'), 'rain_heavy');
  assert.equal(hazardGroup('severe_heat_wave'), 'heat');
  assert.equal(hazardGroup('rain_light'), 'rain_light');
});

// ── Summary line (PRD 5.4) ──
test('summary: greeting by hour, dominant condition and first notable change', () => {
  assert.equal(greetingKey(5), 'home.greeting.morning');
  assert.equal(greetingKey(22), 'home.greeting.night');
  const snap = snapshot({
    hourly: hours({ patch: (h, hr, date) => (date === DATE && hr === 16 ? { wmo: 95, precipProb: 60 } : null) }),
  });
  const s = summarize(snap, t(13), { name: '  Riya  ' });
  assert.equal(s.greetingKey, 'home.greeting.afternoon');
  assert.equal(s.name, 'Riya');
  assert.equal(s.conditionKey, 'wmo.95');
  assert.deepEqual(s.change, { type: 'thunder', time: at(DATE, 16) });
  assert.equal(summarize(snapshot(), t(13)).change, null);
});
