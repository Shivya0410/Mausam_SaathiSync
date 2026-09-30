// Rule test matrix (PRD section 23). Row numbers match the PRD tables.
// Rows 35 to 40, 44, 45, 49, 56, 57, 67 to 69, 76 and 77 test indices and
// live in mausam-indices.test.mjs.

import test from 'node:test';
import assert from 'node:assert/strict';

import { RULES, runRules, capTips } from '../src/lib/mausam/rules/index.js';
import { mergeHouseholdCards } from '../src/lib/mausam/rules/household.js';
import { officialStatus, ribbonWarnings } from '../src/lib/mausam/warnings.js';
import { addDays } from '../src/lib/mausam/time.js';
import { at, DATE, hours, days, snapshot, warning, ctx } from './helpers/weather.mjs';

const TOMORROW = addDays(DATE, 1);
const byId = Object.fromEntries(RULES.map((r) => [r.id, r]));
const fire = (id, c) => byId[id].when(c);
const sev = (id, m) => byId[id].severity(m);
const onToday = (hr, over) => (h, localHr, date) => (date === DATE && localHr === hr ? over : null);
const snapWith = (patch, over = {}) => snapshot({ hourly: hours({ patch }), ...over });
const ids = (cards) => cards.map((c) => c.ruleId);

test('there are 50 rules with unique ids and the documented shape', () => {
  assert.equal(RULES.length, 50);
  assert.equal(new Set(RULES.map((r) => r.id)).size, 50);
  for (const r of RULES) {
    assert.ok(Array.isArray(r.personas) && r.personas.length, r.id);
    assert.ok(['tip', 'good'].includes(r.kind), r.id);
    assert.equal(typeof r.when, 'function', r.id);
    assert.equal(typeof r.severity, 'function', r.id);
  }
});

// ── 23.1 General ──
test('1: umbrella fires at 16:00 with severity 1', () => {
  const m = fire('general.umbrella', ctx({ snap: snapWith(onToday(16, { precipProb: 70, precipMm: 2.1 })) }));
  assert.equal(m.time, at(DATE, 16));
  assert.equal(sev('general.umbrella', m), 1);
});
test('2: umbrella does not fire at 55%', () => {
  assert.equal(fire('general.umbrella', ctx({ snap: snapWith(onToday(16, { precipProb: 55, precipMm: 3 })) })), null);
});
test('3: umbrella does not fire below 0.5 mm', () => {
  assert.equal(fire('general.umbrella', ctx({ snap: snapWith(onToday(16, { precipProb: 85, precipMm: 0.3 })) })), null);
});
test('4: umbrella at 85% and 4 mm is severity 2', () => {
  const m = fire('general.umbrella', ctx({ snap: snapWith(onToday(18, { precipProb: 85, precipMm: 4 })) }));
  assert.equal(sev('general.umbrella', m), 2);
});
test('5: heavy rain soon fires on 18 mm in 3 hours', () => {
  const snap = snapWith((h, hr, date) => (date === DATE && hr >= 12 && hr <= 14 ? { precipMm: 6, precipProb: 90 } : null));
  const m = fire('general.heavyRainSoon', ctx({ snap }));
  assert.equal(m.mm, 18);
  assert.equal(sev('general.heavyRainSoon', m), 2);
});
test('6: IMD heavy rain Orange suppresses the tip and carries its advice', () => {
  const snap = snapWith((h, hr, date) => (date === DATE && hr >= 12 && hr <= 14 ? { precipMm: 6, precipProb: 90 } : null), {
    warnings: [warning({ hazard: 'heavy_rain', level: 3 })],
  });
  const cards = runRules(ctx({ snap }));
  assert.ok(!ids(cards).includes('general.heavyRainSoon'));
  assert.equal(cards[0].kind, 'official');
  assert.ok(cards[0].addOns.some((a) => a.ruleId === 'general.heavyRainSoon'));
  assert.ok(ids(cards).includes('general.umbrella'), 'light-rain umbrella tip is a different decision and stays');
});
test('7: heat fires from 13:00 with severity 2', () => {
  const snap = snapWith((h, hr, date) => (date === DATE && hr === 13 ? { feelsC: 43 } : date === DATE && hr === 14 ? { feelsC: 44 } : null));
  const m = fire('general.heat', ctx({ snap }));
  assert.equal(m.start, at(DATE, 13));
  assert.equal(sev('general.heat', m), 2);
});
test('8: heat index 55 is severity 3', () => {
  const m = fire('general.heat', ctx({ snap: snapWith(onToday(14, { feelsC: 55 })) }));
  assert.equal(sev('general.heat', m), 3);
});
test('9: heat index 39 does not fire', () => {
  assert.equal(fire('general.heat', ctx({ snap: snapWith(onToday(14, { feelsC: 39 })) })), null);
});
test('10: IMD heat wave Orange suppresses the heat tip with an add-on line', () => {
  const snap = snapWith(onToday(14, { feelsC: 45 }), { warnings: [warning({ hazard: 'heat_wave', level: 3 })] });
  const cards = runRules(ctx({ snap }));
  assert.ok(!ids(cards).includes('general.heat'));
  assert.equal(cards[0].adviceKey, 'officialAdvice.heat.orange');
  assert.deepEqual(cards[0].addOns.map((a) => a.ruleId), ['general.heat']);
});
test('11: warm night fires at Tmin 31', () => {
  const snap = snapshot({ daily: days({ patch: (d, i, date) => (date === DATE ? { minC: 31 } : null) }) });
  assert.deepEqual(fire('general.warmNight', ctx({ snap })), { tmin: 31 });
});
test('12 and 13: cold morning severity by Tmin', () => {
  const at8 = snapshot({ daily: days({ patch: (d, i, date) => (date === DATE ? { minC: 8 } : null) }) });
  assert.equal(sev('general.cold', fire('general.cold', ctx({ snap: at8 }))), 1);
  const at3 = snapshot({ daily: days({ patch: (d, i, date) => (date === DATE ? { minC: 3 } : null) }) });
  assert.equal(sev('general.cold', fire('general.cold', ctx({ snap: at3 }))), 2);
  assert.equal(fire('general.cold', ctx()), null);
});
test('14: fog 06:00 to 08:00', () => {
  const snap = snapWith((h, hr, date) => (date === DATE && hr >= 6 && hr <= 8 ? { visibilityM: 180 } : null));
  const m = fire('general.fog', ctx({ snap, now: at(DATE, 4) }));
  assert.equal(m.start, at(DATE, 6));
  assert.equal(m.end, at(DATE, 8));
});
test('15: no visibility data means no fog tip', () => {
  const snap = snapWith(() => ({ visibilityM: null }));
  assert.equal(fire('general.fog', ctx({ snap, now: at(DATE, 4) })), null);
});
test('16: thunderstorm within 3 hours fires with severity 2', () => {
  const m = fire('general.lightning', ctx({ snap: snapWith(onToday(17, { wmo: 95, precipProb: 50 })), now: at(DATE, 15, 30) }));
  assert.equal(m.time, at(DATE, 17));
  assert.equal(sev('general.lightning', m), 2);
});
test('17: IMD nowcast thunderstorm leaves only the official card', () => {
  const snap = snapWith(onToday(17, { wmo: 95, precipProb: 50 }), {
    warnings: [warning({ source: 'imd_nowcast', hazard: 'thunderstorm', level: 3, validTo: at(DATE, 18, 30) })],
  });
  const cards = runRules(ctx({ snap, now: at(DATE, 15, 30) }));
  assert.equal(cards[0].kind, 'official');
  assert.ok(!ids(cards).includes('general.lightning'));
});
test('18: dust fires on PM10 310 with gusts 42', () => {
  const snap = snapWith(onToday(12, { gustKmh: 42 }), { air: { aqi: 280, pm10: 310, pm25: 90 } });
  assert.equal(fire('general.dust', ctx({ snap })).pm10, 310);
  assert.equal(fire('general.dust', ctx()), null);
});
test('19: AQI 268 fires as Poor', () => {
  const m = fire('general.aqiPoor', ctx({ snap: snapshot({ air: { aqi: 268 } }) }));
  assert.equal(m.category, 'poor');
});
test('20: AQI 420 fires Severe (severity 3) and replaces the Poor tip', () => {
  const cards = runRules(ctx({ snap: snapshot({ air: { aqi: 420 } }), personas: ['health'], sensitivities: ['asthma'] }));
  const severe = cards.find((c) => c.ruleId === 'general.aqiSevere');
  assert.equal(severe.severity, 3);
  assert.ok(!ids(cards).includes('general.aqiPoor'));
  assert.ok(!ids(cards).includes('health.sensitiveAqi'));
});
test('21: a calm day ends with one GOOD card', () => {
  const cards = runRules(ctx());
  const good = cards.filter((c) => c.kind === 'good');
  assert.equal(good.length, 1);
  assert.equal(good[0].ruleId, 'general.goodEvening');
});
test('22: a severity 2 tip removes the GOOD card', () => {
  const cards = runRules(ctx({ snap: snapshot({ air: { aqi: 268 } }) }));
  assert.ok(cards.some((c) => c.severity >= 2 && c.kind === 'tip'));
  assert.equal(cards.filter((c) => c.kind === 'good').length, 0);
});

// ── 23.2 Health ──
test('23: best time to step out is 14:00 to 16:00', () => {
  const snap = snapWith((h, hr) => (hr === 14 || hr === 15 ? { feelsC: 33 } : { feelsC: 38 }));
  const m = fire('health.bestTimeOut', ctx({ snap, personas: ['health'] }));
  assert.equal(m.start, at(DATE, 14));
  assert.equal(m.end, at(DATE, 16));
});
test('24 and 25: UV threshold is 8', () => {
  const snap9 = snapWith((h, hr, date) => (date === DATE && hr >= 11 && hr <= 13 ? { uv: 9 } : null));
  const m = fire('health.uvHigh', ctx({ snap: snap9 }));
  assert.equal(m.category, 'very_high');
  assert.equal(m.start, at(DATE, 11));
  assert.equal(m.end, at(DATE, 14));
  const snap7 = snapWith((h, hr, date) => (date === DATE && hr >= 11 && hr <= 13 ? { uv: 7 } : null));
  assert.equal(fire('health.uvHigh', ctx({ snap: snap7 })), null);
});
test('26 and 27: humid night fires only for asthma or skin sensitivity', () => {
  const snap = snapWith((h, hr, date) => ((date === DATE && hr >= 20) || (date === TOMORROW && hr <= 2) ? { rh: 90 } : null));
  assert.equal(fire('health.humid', ctx({ snap, sensitivities: ['asthma'] })).start, at(DATE, 20));
  assert.equal(fire('health.humid', ctx({ snap })), null);
});
test('28: allergy estimate High fires, labelled as an estimate', () => {
  const snap = snapshot({
    hourly: hours({ startDate: '2026-03-09', patch: () => ({ windKmh: 18, rh: 40 }) }),
    daily: days({ startDate: '2026-03-09' }),
    air: { aqi: 120, pm10: 140 },
  });
  const m = fire('health.allergyHigh', ctx({ snap, now: at('2026-03-10', 10), sensitivities: ['allergies'] }));
  assert.equal(m.level, 'high');
  assert.equal(m.estimate, true);
});
test('29 and 30: sensitive AQI needs a sensitivity', () => {
  const snap = snapshot({ air: { aqi: 150 } });
  const m = fire('health.sensitiveAqi', ctx({ snap, sensitivities: ['heart'] }));
  assert.equal(sev('health.sensitiveAqi', m), 2);
  assert.equal(fire('health.sensitiveAqi', ctx({ snap })), null);
});

// ── 23.3 Fitness ──
const hot = (over) => (h, hr, date) => ({ feelsC: 40, ...(over ? over(h, hr, date) || {} : {}) });
test('31: best early-morning window 05:00 to 07:00', () => {
  const snap = snapWith(hot((h, hr, date) => (date === TOMORROW && hr === 5 ? { feelsC: 29, isDay: true } : date === TOMORROW && hr === 6 ? { feelsC: 27 } : null)));
  const m = fire('fitness.bestWindow', ctx({ snap, settings: { fitness: { band: 'early_morning', durationMin: 60 } } }));
  assert.equal(m.start, at(TOMORROW, 5));
  assert.equal(m.end, at(TOMORROW, 7));
  assert.equal(m.outsideBand, false);
});
test('32: falls back outside the usual band with a note', () => {
  const snap = snapWith(hot(onToday(17, { feelsC: 33 })));
  const m = fire('fitness.bestWindow', ctx({ snap, settings: { fitness: { band: 'early_morning' } } }));
  assert.equal(m.start, at(DATE, 17));
  assert.equal(m.outsideBand, true);
});
test('33: no comfortable hour in 36 hours', () => {
  const c = ctx({ snap: snapWith(hot()), settings: { fitness: { band: 'morning' } } });
  assert.equal(fire('fitness.bestWindow', c), null);
  assert.equal(sev('fitness.noSafeWindow', fire('fitness.noSafeWindow', c)), 2);
});
test('34: headwind for cyclists, with direction', () => {
  const snap = snapWith(onToday(12, { gustKmh: 32, windDirDeg: 270 }));
  assert.equal(fire('fitness.headwind', ctx({ snap, settings: { fitness: { activity: 'cycle' } } })).dir, 'W');
  assert.equal(fire('fitness.headwind', ctx({ snap, settings: { fitness: { activity: 'run' } } })), null);
});

// ── 23.4 Coast and fisher ──
const marine = (patch) => ({
  hourly: hours({ patch: (h, hr, date) => ({ ...(patch ? patch(h, hr, date) || {} : {}) }) }).map((h) => ({
    time: h.time,
    waveM: h.waveM ?? 0.4,
    swellM: h.swellM ?? 0.2,
    swellPeriodS: h.swellPeriodS ?? 6,
    waveDirDeg: 250,
    sstC: 28,
    seaLevelM: null,
  })),
  tides: [],
});
test('41: good beach day with a UV note', () => {
  const snap = snapshot({ marine: marine(), daily: days({ patch: () => ({ uvMax: 10 }) }) });
  const cards = runRules(ctx({ snap, personas: ['coast'] }));
  const good = cards.find((c) => c.ruleId === 'coast.goodDay');
  assert.ok(good);
  assert.equal(good.params.uv, 10);
});
test('stay-out and caution verdicts become coast tips', () => {
  const rough = snapshot({ marine: marine(() => ({ waveM: 2.3 })) });
  assert.equal(fire('coast.stayOut', ctx({ snap: rough })).reason, 'waves');
  const choppy = snapshot({ marine: marine(() => ({ waveM: 1.2 })) });
  assert.equal(fire('coast.caution', ctx({ snap: choppy })).reason, 'waves');
  assert.equal(fire('coast.stayOut', ctx({ snap: choppy })), null);
});
test('42: fishermen warning means no-go, with the verbatim text', () => {
  const text = 'Fishermen are advised not to venture into the sea along the Odisha coast till 3 October.';
  const snap = snapshot({ marine: marine(), warnings: [warning({ source: 'imd_marine', hazard: 'high_waves', text })] });
  const cards = runRules(ctx({ snap, personas: ['fisher'] }));
  const noGo = cards.find((c) => c.ruleId === 'fisher.noGo');
  assert.equal(noGo.severity, 3);
  assert.equal(noGo.params.text, text);
  assert.equal(cards[0].kind, 'official', 'the official card is still shown first');
});
test('43: calm window tomorrow 04:00 to 08:00', () => {
  const snap = snapshot({ marine: marine(() => ({ waveM: 0.5 })) });
  const m = fire('fisher.window', ctx({ snap }));
  assert.equal(m.start, at(TOMORROW, 4));
  assert.equal(m.end, at(TOMORROW, 8));
  const windy = snapshot({ marine: marine(() => ({ waveM: 0.5 })), hourly: hours({ patch: () => ({ windKmh: 25 }) }) });
  assert.equal(fire('fisher.window', ctx({ snap: windy })), null);
});

// ── 23.5 Travel ──
function travelCtx({ from = TOMORROW, departAt = at(TOMORROW, 7), origin = {}, destination = {} } = {}) {
  const trip = { id: 't1', name: 'Goa', from, to: addDays(from, 3), mode: 'flight', departAt, originAirport: 'VIDP' };
  return ctx({ personas: ['travel'], settings: { travel: { trips: [trip] } }, trips: { t1: { origin, destination } } });
}
test('46: fog at the departure airport tomorrow fires', () => {
  const origin = { hourly: hours({ patch: (h, hr, date) => (date === TOMORROW && hr === 6 ? { visibilityM: 300 } : null) }) };
  const m = fire('travel.fogFlight', travelCtx({ origin }));
  assert.equal(m.airport, 'VIDP');
  assert.equal(m.visibilityM, 300);
});
test('47: a trip in 5 days is outside the 48 hour horizon', () => {
  const d = addDays(DATE, 5);
  const origin = { hourly: hours({ patch: () => ({ visibilityM: 300 }) }) };
  assert.equal(fire('travel.fogFlight', travelCtx({ from: d, departAt: at(d, 7), origin })), null);
});
test('48: Orange warning at the destination on trip day 2', () => {
  const day2 = addDays(TOMORROW, 1);
  const destination = { warnings: [warning({ level: 3, hazard: 'heavy_rain', validFrom: at(day2, 8), validTo: at(addDays(day2, 1), 8) })] };
  const m = fire('travel.destWarning', travelCtx({ destination }));
  assert.equal(m.date, day2);
  assert.equal(sev('travel.destWarning', m), 2);
});
test('pack fires within 7 days with the top items', () => {
  const destination = { daily: days({ patch: () => ({ minC: 7, maxC: 15, precipProbMax: 60, uvMax: 7 }) }) };
  const m = fire('travel.pack', travelCtx({ destination }));
  assert.deepEqual(m.items, ['umbrella', 'waterproofShoes', 'warmLayer']);
});
test('50: landslide risk on hill roads', () => {
  const destination = { elevationM: 2100, daily: days({ patch: (d, i, date) => (date === TOMORROW ? { precipMm: 70 } : null) }) };
  assert.equal(fire('travel.hillRain', travelCtx({ destination })).date, TOMORROW);
  assert.equal(fire('travel.hillRain', travelCtx({ destination: { ...destination, elevationM: 300 } })), null);
});

// ── 23.6 Family ──
const school = { family: { schoolTimes: { morning: '07:15', afternoon: '14:00' } } };
test('51: school morning rain means an umbrella', () => {
  const m = fire('family.schoolMorning', ctx({ snap: snapWith(onToday(7, { precipProb: 60 })), now: at(DATE, 6), settings: school }));
  assert.equal(m.condition, 'rain');
  assert.deepEqual(m.chips, ['umbrella']);
});
test('52: school morning fog', () => {
  const m = fire('family.schoolMorning', ctx({ snap: snapWith(onToday(7, { visibilityM: 150 })), now: at(DATE, 6), settings: school }));
  assert.equal(m.condition, 'fog');
});
test('53: afternoon pickup heat means water', () => {
  const m = fire('family.schoolAfternoon', ctx({ snap: snapWith(onToday(14, { feelsC: 43 })), settings: school }));
  assert.equal(m.condition, 'heat');
  assert.deepEqual(byId['family.schoolAfternoon'].chips(m), ['water']);
});
test('54: poor air during evening play', () => {
  const snap = snapWith((h, hr, date) => (date === DATE && hr >= 16 && hr < 19 ? { aqi: 230 } : null));
  assert.equal(fire('family.outdoorPlay', ctx({ snap })).aqi, 230);
});
test('55: no school times set means no school rules', () => {
  const snap = snapWith(onToday(7, { precipProb: 90 }));
  assert.equal(fire('family.schoolMorning', ctx({ snap, now: at(DATE, 6) })), null);
  assert.equal(fire('family.schoolAfternoon', ctx({ snap })), null);
});

// ── 23.7 Farm ──
test('spray tip fires when a window remains today', () => {
  const snap = snapWith((h, hr, date) => (date === DATE && hr >= 16 && hr <= 18 ? { windKmh: 6 } : { windKmh: 0 }));
  assert.equal(fire('farm.spray', ctx({ snap })).start, at(DATE, 16));
});
test('58: no spraying when rain is due within 6 hours', () => {
  const m = fire('farm.noSpray', ctx({ snap: snapWith(onToday(13, { precipProb: 70 })), now: at(DATE, 9) }));
  assert.equal(m.when, at(DATE, 13));
});
test('59: heavy rain in the next 5 days', () => {
  const day2 = addDays(DATE, 2);
  const snap = snapshot({ daily: days({ patch: (d, i, date) => (date === day2 ? { precipMm: 72 } : null) }) });
  assert.deepEqual(fire('farm.heavyRainPrep', ctx({ snap })), { day: day2, mm: 72 });
});
test('60: dry topsoil with no rain coming', () => {
  const snap = snapWith(() => ({ soil: { m0_1: 0.11, m3_9: 0.2, m9_27: 0.25, t0: 25 } }));
  assert.equal(fire('farm.dryIrrigate', ctx({ snap })).moisture, 0.11);
  const wet = { ...snap, daily: days({ patch: (d, i, date) => (date === TOMORROW ? { precipMm: 8 } : null) }) };
  assert.equal(fire('farm.dryIrrigate', ctx({ snap: wet })), null);
});
const night = (over) => (h, hr, date) => ((date === DATE && hr >= 20) || (date === TOMORROW && hr < 8) ? over : null);
test('61 to 63: frost risk tonight', () => {
  const high = fire('farm.frost', ctx({ snap: snapWith(night({ tempC: 1.5 })) }));
  assert.equal(high.risk, 'high');
  assert.equal(sev('farm.frost', high), 3);
  const mod = fire('farm.frost', ctx({ snap: snapWith(night({ tempC: 3, cloudPct: 20, windKmh: 4 })) }));
  assert.equal(mod.risk, 'moderate');
  assert.equal(sev('farm.frost', mod), 2);
  assert.equal(fire('farm.frost', ctx({ snap: snapWith(night({ tempC: 3, cloudPct: 80, windKmh: 4 })) })), null);
});
test('64: hail tomorrow afternoon', () => {
  const snap = snapWith((h, hr, date) => (date === TOMORROW && hr === 15 ? { wmo: 96 } : null));
  const m = fire('farm.hail', ctx({ snap }));
  assert.equal(m.when, at(TOMORROW, 15));
  assert.equal(sev('farm.hail', m), 3);
});
test('65: lightning risk in the fields this afternoon', () => {
  const m = fire('farm.lightningField', ctx({ snap: snapWith(onToday(15, { wmo: 95, precipProb: 55 })), now: at(DATE, 11) }));
  assert.equal(m.prob, 55);
  assert.equal(sev('farm.lightningField', m), 3);
});
test('66: livestock heat', () => {
  assert.equal(fire('farm.heatLivestock', ctx({ snap: snapWith(onToday(13, { feelsC: 42 })) })).hi, 42);
  assert.equal(fire('farm.heatLivestock', ctx()), null);
});

// ── 23.8 Commute ──
const office = { id: 'work', name: 'Office', lat: 19.0, lon: 72.85 };
const report = (over) => ({
  id: 'r1',
  type: 'waterlogging',
  status: 'ai_verified',
  lat: 19.0027,
  lon: 72.85,
  areaName: 'Andheri Subway',
  observedAt: at(DATE, 9, 20),
  ...over,
});
test('70: verified report 300 m from work, 40 minutes ago', () => {
  const m = fire('commute.waterlogging', ctx({ savedPlaces: [office], reports: [report()] }));
  assert.equal(m.minutes, 40);
  assert.equal(m.place, 'Andheri Subway');
});
test('71: unverified reports never reach cards', () => {
  assert.equal(fire('commute.waterlogging', ctx({ savedPlaces: [office], reports: [report({ status: 'unverified' })] })), null);
});
test('72: a report 2 km away does not fire', () => {
  assert.equal(fire('commute.waterlogging', ctx({ savedPlaces: [office], reports: [report({ lat: 19.018 })] })), null);
});
test('reports near the home-work corridor count; old reports do not', () => {
  const settings = { commute: { home: { lat: 19.0, lon: 72.8 }, work: { lat: 19.0, lon: 72.9 } } };
  assert.ok(fire('commute.waterlogging', ctx({ settings, reports: [report({ lat: 19.001, lon: 72.85 })] })));
  assert.equal(fire('commute.waterlogging', ctx({ settings, reports: [report({ lat: 19.001, lon: 72.85, observedAt: at(DATE, 6) })] })), null);
});
test('73: two-wheeler heat at 18:30', () => {
  const snap = snapWith((h, hr, date) => (date === DATE && (hr === 18 || hr === 19) ? { feelsC: 43 } : null));
  const m = fire('commute.twoWheelerHeat', ctx({ snap, settings: { commute: { times: ['18:30'], mode: 'two_wheeler' } } }));
  assert.equal(m.hi, 43);
  assert.equal(fire('commute.twoWheelerHeat', ctx({ snap, settings: { commute: { times: ['18:30'], mode: 'car' } } })), null);
});
test('leave card uses the next departure and the rain spans', () => {
  const snap = snapWith((h, hr, date) => (date === DATE && hr >= 18 && hr < 20 ? { precipProb: 80, precipMm: 3 } : null));
  const m = fire('commute.leave', ctx({ snap, settings: { commute: { times: ['08:30', '18:30'] } } }));
  assert.equal(m.departure, at(DATE, 18, 30));
  assert.equal(m.verdict, 'leave_by');
  assert.equal(m.time, at(DATE, 17, 45));
  assert.equal(fire('commute.leave', ctx()), null, 'no departure times, no card');
});

// ── 23.9 Events and work ──
const eventIn = (n, over = {}) => ({ events: { events: [{ id: 'e1', name: 'Wedding', date: addDays(DATE, n), slot: 'evening', outdoor: true, ...over }] } });
test('74: rain risk for an event in 6 days', () => {
  const snap = snapshot({ daily: days({ patch: (d, i, date) => (date === addDays(DATE, 6) ? { precipProbMax: 65 } : null) }) });
  assert.equal(fire('events.rainRisk', ctx({ snap, settings: eventIn(6) })).prob, 65);
});
test('75: strong gusts in the event slot', () => {
  const snap = snapshot({ daily: days({ patch: (d, i, date) => (date === addDays(DATE, 6) ? { gustMaxKmh: 44 } : null) }) });
  assert.equal(fire('events.wind', ctx({ snap, settings: eventIn(6) })).gust, 44);
});
test('comfort card for an event within 16 days', () => {
  const m = fire('events.comfort', ctx({ settings: eventIn(3) }));
  assert.ok(m.score > 0 && ['excellent', 'good', 'fair', 'poor'].includes(m.band));
  assert.equal(fire('events.comfort', ctx({ settings: eventIn(40) })), null);
});
test('78: climatology beyond 16 days', () => {
  const m = fire('events.climatology', ctx({ settings: eventIn(60), climatology: { e1: { rainyYears: 3, yearsCounted: 10 } } }));
  assert.equal(m.n, 3);
});
const workSettings = { work: { hours: ['09:00', '19:00'], type: 'delivery' } };
const hotNoon = (h, hr, date) => (date === DATE && hr >= 12 && hr <= 16 ? { feelsC: 43 } : null);
test('79: dangerous heat 12:00 to 17:00 in work hours', () => {
  const m = fire('work.heatDanger', ctx({ snap: snapWith(hotNoon), settings: workSettings }));
  assert.equal(m.start, at(DATE, 12));
  assert.equal(m.end, at(DATE, 17));
});
test('80: nearest cool spot 700 m away', () => {
  const coolSpots = [{ name: 'Metro concourse', lat: 26.8563, lon: 80.95, type: 'metro' }];
  const m = fire('work.coolSpot', ctx({ snap: snapWith(hotNoon), settings: workSettings, coolSpots }));
  assert.equal(m.name, 'Metro concourse');
  assert.ok(Math.abs(m.distanceM - 700) < 20);
  assert.equal(fire('work.coolSpot', ctx({ settings: workSettings, coolSpots })), null);
});
test('81: nowcast thunderstorm triggers the 30-30 takeover', () => {
  const snap = snapshot({ warnings: [warning({ source: 'imd_nowcast', hazard: 'thunderstorm', level: 3 })] });
  const cards = runRules(ctx({ snap, personas: ['work'] }));
  const card = cards.find((c) => c.ruleId === 'work.lightning30');
  assert.equal(card.severity, 3);
  assert.equal(card.params.takeover, true);
});
test('lightning strikes within 10 km in the last 30 minutes also fire', () => {
  const lightningStrikes = [{ lat: 26.9, lon: 80.95, time: at(DATE, 9, 50) }];
  assert.equal(fire('work.lightning30', ctx({ lightningStrikes })).source, 'strikes');
  assert.equal(fire('work.lightning30', ctx({ lightningStrikes: [{ ...lightningStrikes[0], time: at(DATE, 9) }] })), null);
});
test('82: heavy rain for delivery riders at 19:00', () => {
  const settings = { work: { hours: ['11:00', '21:00'], type: 'delivery' } };
  const m = fire('work.heavyRainRiding', ctx({ snap: snapWith(onToday(19, { precipMm: 9, precipProb: 90 })), settings }));
  assert.equal(m.when, at(DATE, 19));
});

// ── 23.10 Ordering and suppression ──
test('83: Red, then Yellow, then tips by severity', () => {
  const snap = snapshot({
    air: { aqi: 268 },
    hourly: hours({ patch: onToday(16, { precipProb: 70, precipMm: 1 }) }),
    warnings: [
      warning({ id: 'y', level: 2, hazard: 'dense_fog' }),
      warning({ id: 'r', level: 4, hazard: 'cyclone' }),
    ],
  });
  const cards = runRules(ctx({ snap }));
  assert.deepEqual(cards.slice(0, 2).map((c) => c.params.level), [4, 2]);
  const tips = cards.filter((c) => c.kind === 'tip');
  assert.ok(tips.length >= 2);
  for (let i = 1; i < tips.length; i++) assert.ok(tips[i - 1].severity >= tips[i].severity);
});
test('84: official heat card collects both heat tips as add-ons', () => {
  const snap = snapWith(hotNoon, { warnings: [warning({ hazard: 'heat_wave', level: 3 })] });
  const cards = runRules(ctx({ snap, personas: ['work'], settings: workSettings }));
  assert.equal(cards[0].kind, 'official');
  assert.deepEqual(cards[0].addOns.map((a) => a.ruleId).sort(), ['general.heat', 'work.heatDanger']);
  assert.ok(!ids(cards).includes('general.heat') && !ids(cards).includes('work.heatDanger'));
});
test('85: 8 tips show 6 with "See all (8)"', () => {
  const rules = Array.from({ length: 8 }, (_, i) => ({
    id: `test.r${i}`,
    personas: ['all'],
    kind: 'tip',
    when: () => ({}),
    severity: () => 1,
  }));
  const cards = runRules(ctx(), {}, rules);
  const { shown, total, hidden } = capTips(cards);
  assert.equal(shown.length, 6);
  assert.equal(total, 8);
  assert.equal(hidden, 2);
});
test('86: a dismissed tip is not shown today', () => {
  const snap = snapshot({ air: { aqi: 268 } });
  assert.ok(ids(runRules(ctx({ snap }))).includes('general.aqiPoor'));
  assert.ok(!ids(runRules(ctx({ snap }), { dismissed: new Set(['general.aqiPoor']) })).includes('general.aqiPoor'));
});
test('87 and 88: household merge by rule and place', () => {
  const card = { ruleId: 'general.fog', kind: 'tip', severity: 2 };
  const same = mergeHouseholdCards([
    { member: { id: 'papa' }, placeId: 'home', cards: [card] },
    { member: { id: 'dadi' }, placeId: 'home', cards: [card] },
  ]);
  assert.equal(same.cards.length, 1);
  assert.deepEqual(same.cards[0].members, ['papa', 'dadi']);
  const apart = mergeHouseholdCards([
    { member: { id: 'papa' }, placeId: 'home', cards: [card] },
    { member: { id: 'riya' }, placeId: 'hostel', cards: [card] },
  ]);
  assert.deepEqual(apart.cards.map((c) => c.placeId), ['home', 'hostel']);
});
test('89: unavailable warnings never read as "No warnings"', () => {
  const now = Date.parse(at(DATE, 10));
  assert.equal(officialStatus({ warnings: [], warningsStatus: 'unavailable' }, now).state, 'unavailable');
  assert.equal(officialStatus(null, now).state, 'unavailable');
  assert.equal(officialStatus({ warnings: [], warningsStatus: 'ok' }, now).state, 'no_warnings');
  const active = officialStatus({ warnings: [warning({ level: 2 }), warning({ id: 'b', level: 4 })], warningsStatus: 'ok' }, now);
  assert.equal(active.state, 'active');
  assert.equal(active.highest.level, 4);
  assert.deepEqual(ribbonWarnings({ warnings: [warning({ level: 2 }), warning({ id: 'r', level: 4 })] }, now).map((w) => w.id), ['r']);
});
test('90: official cards cannot be dismissed', () => {
  const snap = snapshot({ warnings: [warning()] });
  const cards = runRules(ctx({ snap }), { dismissed: new Set(['official.imd_district']) });
  assert.equal(cards[0].kind, 'official');
  assert.equal(cards[0].dismissible, false);
});
test('expired warnings are ignored; a broken rule never breaks the list', () => {
  const snap = snapshot({ warnings: [warning({ validTo: at(DATE, 9) })] });
  assert.equal(runRules(ctx({ snap })).filter((c) => c.kind === 'official').length, 0);
  const broken = [{ id: 'x', personas: ['all'], kind: 'tip', when: () => { throw new Error('boom'); }, severity: () => 1 }];
  assert.deepEqual(runRules(ctx(), {}, broken), []);
});
test('persona filter: farm rules do not run for a commuter', () => {
  const snap = snapWith(onToday(13, { precipProb: 70 }));
  assert.ok(!ids(runRules(ctx({ snap, personas: ['commute'], now: at(DATE, 9) }))).includes('farm.noSpray'));
  assert.ok(ids(runRules(ctx({ snap, personas: ['farm'], now: at(DATE, 9) }))).includes('farm.noSpray'));
});
