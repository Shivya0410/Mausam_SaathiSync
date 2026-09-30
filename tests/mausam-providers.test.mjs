// Provider adapters, fixtures and API contracts (PRD sections 12, 13.3,
// 24; tasks T1.1 to T1.6). Payloads mirror the shapes returned by the live
// services when verified on 30 Sep 2026. No test touches the network.

import test from 'node:test';
import assert from 'node:assert/strict';

import { normaliseForecast, forecastUrl } from '../src/lib/providers/openMeteo/forecast.js';
import { normaliseAir } from '../src/lib/providers/openMeteo/airQuality.js';
import { normaliseMarine } from '../src/lib/providers/openMeteo/marine.js';
import { searchBundled, searchPlaces } from '../src/lib/providers/openMeteo/geocoding.js';
import { climatologyWindows, summariseClimatology } from '../src/lib/providers/openMeteo/archive.js';
import { formatOffset, withOffset } from '../src/lib/providers/openMeteo/common.js';
import { normaliseDistrictWarnings, normaliseNowcast, matchDistrict } from '../src/lib/providers/imd/index.js';
import { districtColourToLevel, nowcastColourToLevel } from '../src/lib/providers/imd/warningCodes.js';
import { parseRss, parseCap, capMatchesPlace, capScope, inCapPolygon, capHazard } from '../src/lib/providers/sachet/cap.js';
import { normaliseStations, nearestStation, parseCpcbTime } from '../src/lib/providers/cpcb/aqi.js';
import { decodeMetar, tafSummary, visibilityM, weatherCodes } from '../src/lib/providers/aviation/decode.js';
import { combineWarnings, mergeHourlyAqi, inIndia } from '../src/lib/providers/snapshot.js';
import { buildScenario, scenarioReports, SCENARIO_IDS } from '../src/data/fixtures/scenarios.js';
import { LruCache } from '../src/server/cache/lru.js';
import { parseQuery, q } from '../src/server/http/query.js';
import { ApiError } from '../src/server/http/errors.js';
import { sunTimes } from '../src/lib/mausam/sun.js';
import { runRules, buildContext } from '../src/lib/mausam/rules/index.js';
import { AIRPORTS } from '../src/data/airports.js';
import { BEACHES } from '../src/data/beaches.js';
import { CITIES } from '../src/data/cities.js';

const NOW = Date.parse('2026-09-30T14:10:00+05:30');

// ── Open-Meteo forecast (T1.1) ──
const forecastJson = {
  utc_offset_seconds: 19800,
  timezone: 'Asia/Kolkata',
  elevation: 117,
  current: {
    time: '2026-09-30T14:00', temperature_2m: 32, relative_humidity_2m: 70, apparent_temperature: 38,
    is_day: 1, weather_code: 2, wind_speed_10m: 12, wind_direction_10m: 45, wind_gusts_10m: 20,
    visibility: 9440, uv_index: 4.15,
  },
  hourly: {
    time: ['2026-09-30T13:00', '2026-09-30T14:00'],
    temperature_2m: [31, 22],
    relative_humidity_2m: [70, 80],
    dew_point_2m: [25, 18],
    apparent_temperature: [37, 23.4],
    precipitation_probability: [10, null],
    precipitation: [0, 0.2],
    weather_code: [2, 61],
    cloud_cover: [40, 90],
    visibility: [9440, null],
    wind_speed_10m: [10, 14],
    wind_direction_10m: [45, 90],
    wind_gusts_10m: [18, 25],
    uv_index: [5.26, 0.1],
    is_day: [1, 0],
    soil_moisture_0_to_1cm: [0.345, 0.3],
    soil_moisture_3_to_9cm: [0.33, 0.33],
    soil_moisture_9_to_27cm: [0.31, 0.31],
    soil_temperature_0cm: [30, 28],
  },
  daily: {
    time: ['2026-09-30'],
    weather_code: [61], temperature_2m_max: [33], temperature_2m_min: [24], apparent_temperature_max: [39],
    precipitation_sum: [4], precipitation_probability_max: [60], wind_speed_10m_max: [15],
    wind_gusts_10m_max: [30], uv_index_max: [7.1], sunrise: ['2026-09-30T05:58'], sunset: ['2026-09-30T17:53'],
  },
};

test('T1.1: forecast normalises units, offsets and the feels-like rule', () => {
  const f = normaliseForecast(forecastJson);
  assert.equal(f.utcOffsetSeconds, 19800);
  assert.equal(f.hourly[0].time, '2026-09-30T13:00:00+05:30');
  assert.equal(f.hourly[0].feelsC, 37.6, 'heat index applies at 31°C, 70% RH');
  assert.equal(f.hourly[1].feelsC, 23.4, 'below 27°C the model apparent temperature is used');
  assert.equal(f.hourly[1].precipProb, 0, 'missing probability becomes 0');
  assert.equal(f.hourly[1].visibilityM, null, 'missing visibility stays null, never invented');
  assert.equal(f.hourly[0].uv, 5.3);
  assert.equal(f.hourly[1].isDay, false);
  assert.deepEqual(f.hourly[0].soil, { m0_1: 0.345, m3_9: 0.33, m9_27: 0.31, t0: 30 });
  assert.equal(f.daily[0].sunrise, '2026-09-30T05:58:00+05:30');
  assert.equal(f.current.updatedAt, '2026-09-30T14:00:00+05:30');
  assert.equal(f.current.source, 'open-meteo');
});

test('forecast URL rounds coordinates to 2 decimals and asks for 12 past + 48 hours', () => {
  const u = new URL(forecastUrl({ lat: 26.84712, lon: 80.94621 }));
  assert.equal(u.searchParams.get('latitude'), '26.85');
  assert.equal(u.searchParams.get('longitude'), '80.95');
  assert.equal(u.searchParams.get('past_hours'), '12');
  assert.equal(u.searchParams.get('forecast_hours'), '48');
  assert.equal(formatOffset(-12600), '-03:30');
  assert.equal(withOffset('2026-09-30T14:00', '+05:30'), '2026-09-30T14:00:00+05:30');
});

// ── Air quality (T1.2) ──
test('T1.2: AQI is computed from the trailing 24 h model mean', () => {
  const time = Array.from({ length: 48 }, (_, i) => `2026-09-29T${String(i % 24).padStart(2, '0')}:00`.replace('29T', i < 24 ? '29T' : '30T'));
  const j = { utc_offset_seconds: 19800, hourly: { time, pm2_5: time.map(() => 45), pm10: time.map(() => 40) } };
  const air = normaliseAir(j, NOW);
  assert.equal(air.aqi, 75);
  assert.equal(air.category, 'satisfactory');
  assert.equal(air.dominant, 'pm2_5');
  assert.equal(air.method, 'computed');
  assert.ok(air.hourly.length > 0);
  assert.equal(normaliseAir({ hourly: { time: [] } }, NOW), null);
});

// ── Marine and tides ──
test('marine normalises, derives tides, and returns null inland', () => {
  const time = Array.from({ length: 26 }, (_, i) => `2026-09-${i < 24 ? 30 : '31'}T${String(i % 24).padStart(2, '0')}:00`);
  const j = {
    utc_offset_seconds: 19800,
    hourly: {
      time,
      wave_height: time.map(() => 1.0),
      swell_wave_height: time.map(() => 0.8),
      swell_wave_period: time.map(() => 6.8),
      wave_period: time.map(() => 9.4),
      wave_direction: time.map(() => 235),
      sea_surface_temperature: time.map(() => 29.1),
      sea_level_height_msl: time.map((_, i) => Math.round(Math.cos((i * 2 * Math.PI) / 12.42) * 100) / 100),
    },
  };
  const m = normaliseMarine(j);
  assert.equal(m.hourly[0].waveM, 1.0);
  assert.ok(m.tides.length >= 3);
  assert.ok(m.tides.every((t) => ['high', 'low'].includes(t.type)));
  const inland = { hourly: { time, wave_height: time.map(() => null) } };
  assert.equal(normaliseMarine(inland), null);
  const noTide = { ...j, hourly: { ...j.hourly, sea_level_height_msl: time.map(() => null) } };
  assert.deepEqual(normaliseMarine(noTide).tides, []);
});

// ── Geocoding (T1.6) ──
test('T1.6: PIN codes ask for a place name; bundled search matches English and Hindi', async () => {
  assert.deepEqual(await searchPlaces('226001'), { ok: true, data: [], source: 'none', hint: 'place_name' });
  assert.equal(searchBundled('luck')[0].name, 'Lucknow');
  assert.equal(searchBundled('लखनऊ')[0].name, 'Lucknow');
  assert.deepEqual(searchBundled('zzz'), []);
});

// ── Climatology ──
test('climatology windows skip 29 February in non-leap years (E24)', () => {
  const wins = climatologyWindows(2, 29, { years: 10, currentYear: 2026 });
  assert.deepEqual(wins.map((w) => w.year), [2016, 2020, 2024]);
  assert.equal(climatologyWindows(12, 14, { years: 10, currentYear: 2026 }).length, 10);
  const s = summariseClimatology([
    { year: 2020, days: [{ precipMm: 3, maxC: 22, minC: 9, gustKmh: 20 }] },
    { year: 2021, days: [{ precipMm: 0, maxC: 24, minC: 11, gustKmh: 30 }] },
  ]);
  assert.deepEqual(s, { yearsCounted: 2, rainyYears: 1, typicalMaxC: 23, typicalMinC: 10, typicalGustKmh: 25 });
});

// ── IMD (T1.4) ──
test('IMD colour codes: district warnings are 1 = Red, nowcasts are 1 = Green', () => {
  assert.deepEqual([1, 2, 3, 4].map(districtColourToLevel), [4, 3, 2, 1]);
  assert.deepEqual([1, 2, 3, 4].map(nowcastColourToLevel), [1, 2, 3, 4]);
  assert.equal(districtColourToLevel('9'), null);
});

const imdRecord = {
  Obj_id: '573', Date: '2026-09-30', UTC: '0830', District: 'LUCKNOW',
  Day_1: '2,4', Day_2: '1', Day_3: '9', Day_4: '1', Day_5: '1',
  Day1_Color: '2', Day2_Color: '4', Day3_Color: '1', Day4_Color: '4', Day5_Color: '4',
};

test('IMD district warnings become one Warning per hazard per day', () => {
  const w = normaliseDistrictWarnings(imdRecord);
  assert.deepEqual(w.map((x) => [x.day, x.hazard, x.level]), [
    [1, 'heavy_rain', 3],
    [1, 'thunderstorm', 3],
    [3, 'heat_wave', 4],
  ]);
  assert.equal(w[0].validFrom, '2026-09-30T00:00:00+05:30');
  assert.equal(w[2].validFrom, '2026-10-02T00:00:00+05:30');
  assert.equal(w[0].issuedAt, '2026-09-30T08:30:00.000Z');
  assert.deepEqual(normaliseDistrictWarnings(null), []);
  assert.deepEqual(normaliseDistrictWarnings({ ...imdRecord, Date: 'bad' }), []);
});

test('IMD district matching by id, then by name', () => {
  const recs = [imdRecord, { ...imdRecord, Obj_id: '1', District: 'PUNE' }];
  assert.equal(matchDistrict(recs, { districtId: '1' }).District, 'PUNE');
  assert.equal(matchDistrict(recs, { district: 'Lucknow' }).Obj_id, '573');
  assert.equal(matchDistrict(recs, { district: 'Patna' }), null);
});

test('IMD nowcast: colour, hazard priority and validity across midnight', () => {
  const n = normaliseNowcast({ Date: '2026-09-30', toi: '2330', Vupto: '0230', color: '3', Cat4: '4', Cat12: '12', message: 'Thunderstorm with lightning likely.' }, 'Lucknow');
  assert.equal(n.level, 3);
  assert.equal(n.hazard, 'thunderstorm');
  assert.equal(n.text, 'Thunderstorm with lightning likely.');
  assert.equal(n.validTo, '2026-10-01T02:30:00+05:30');
  assert.equal(normaliseNowcast({ Date: '2026-09-30', color: '1' }, 'X'), null, 'green means no nowcast card');
});

// ── NDMA SACHET CAP (T1.4) ──
const rss = `<?xml version="1.0"?><rss version="2.0"><channel><title>All India</title>
<item><title>Lightning alert</title><category>Met</category>
<link>https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=1790759797207008</link>
<author>controlroom@ndma.gov.in (Andhra Pradesh SDMA)</author><guid isPermaLink="false">1790759797207008</guid>
<pubDate>Wed, 30 Sep 2026 09:17:32 GMT</pubDate></item></channel></rss>`;

const cap = `<cap:alert xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2">
<cap:identifier>IN-1790759797207008_8</cap:identifier><cap:sender>Andhra-Pradesh-SDMA</cap:sender>
<cap:sent>2026-09-30T14:46:37+05:30</cap:sent><cap:status>Actual</cap:status><cap:msgType>Alert</cap:msgType>
<cap:info><cap:language>en-IN</cap:language><cap:category>Met</cap:category><cap:event>Lightning</cap:event>
<cap:urgency>Expected</cap:urgency><cap:severity>Severe</cap:severity><cap:certainty>Possible</cap:certainty>
<cap:effective>2026-09-30T14:45:00+05:30</cap:effective><cap:expires>2026-09-30T16:45:00+05:30</cap:expires>
<cap:headline>There is a possibility of lightning in your area. Seek shelter in safe buildings - Andhra Pradesh Government.</cap:headline>
<cap:description/><cap:instruction>Please follow SDMA guidelines.</cap:instruction>
<cap:area><cap:areaDesc>sss-lepakshi Mandal </cap:areaDesc></cap:area></cap:info>
<cap:info><cap:language>TL</cap:language><cap:event>Lightning</cap:event><cap:severity>Severe</cap:severity>
<cap:headline>మీ ప్రాంతంలో పిడుగులు పడే అవకాశం ఉంది.</cap:headline><cap:area><cap:areaDesc>sss-lepakshi Mandal</cap:areaDesc></cap:area></cap:info>
</cap:alert>`;

test('SACHET RSS items and a real-shaped CAP alert parse verbatim', () => {
  const items = parseRss(rss);
  assert.equal(items.length, 1);
  assert.match(items[0].link, /FetchXMLFile\?identifier=/);
  const [w] = parseCap(cap);
  assert.equal(w.source, 'ndma_cap');
  assert.equal(w.hazard, 'thunderstorm');
  assert.equal(w.level, 3);
  assert.equal(w.validTo, '2026-09-30T16:45:00+05:30');
  assert.equal(w.instruction, 'Please follow SDMA guidelines.');
  assert.match(w.text, /^There is a possibility of lightning/);
  assert.equal(w.area, 'sss-lepakshi Mandal');
  assert.equal(parseCap(cap.replace('>Actual<', '>Exercise<')).length, 0, 'exercises and tests are never shown');
});

test('CAP scope: place (polygon, district, whole state) versus other districts of the state', () => {
  const [w] = parseCap(cap);
  const author = 'controlroom@ndma.gov.in (Andhra Pradesh SDMA)';
  assert.equal(capScope(w, { state: 'Andhra Pradesh', district: 'Lepakshi' }, author), 'place');
  assert.equal(capScope(w, { state: 'Andhra Pradesh', district: 'Guntur' }, author), 'state');
  assert.equal(capScope(w, { state: 'Bihar', district: 'Patna' }, author), null);
  // Real case seen on 30 Sep 2026: a UP flood alert for Balrampur must not
  // become a Lucknow warning.
  const rapti = { area: 'Rapti, Balrampur, Balrampur, Uttar Pradesh', issuer: 'Uttar-Pradesh-SDMA', polygons: [] };
  assert.equal(capScope(rapti, { state: 'Uttar Pradesh', district: 'Lucknow' }), 'state');
  assert.equal(capScope(rapti, { state: 'Uttar Pradesh', district: 'Balrampur' }), 'place');
  assert.equal(capScope({ area: 'Uttar Pradesh', polygons: [] }, { state: 'Uttar Pradesh', district: 'Lucknow' }), 'place');
  assert.equal(capMatchesPlace(rapti, { state: 'Uttar Pradesh', district: 'Lucknow' }), false);
  const square = '19.0,72.8 19.2,72.8 19.2,73.0 19.0,73.0 19.0,72.8';
  assert.equal(inCapPolygon({ lat: 19.1, lon: 72.9 }, square), true);
  assert.equal(inCapPolygon({ lat: 19.3, lon: 72.9 }, square), false);
  assert.equal(capMatchesPlace({ ...w, polygons: [square] }, { lat: 19.1, lon: 72.9, state: 'Andhra Pradesh' }), true);
  assert.deepEqual(['Cyclone Warning', 'High Wave Alert', 'Flash Flood', 'Heat Wave', 'Landslide'].map(capHazard), [
    'cyclone', 'high_waves', 'flood', 'heat_wave', 'other',
  ]);
});

// ── CPCB ──
test('CPCB stations need three pollutants including PM, nearest within 25 km', () => {
  const rows = [
    ['ITO, Delhi', 28.63, 77.24, 'PM2.5', 205], ['ITO, Delhi', 28.63, 77.24, 'PM10', 330], ['ITO, Delhi', 28.63, 77.24, 'NO2', 60],
    ['Sparse', 28.62, 77.22, 'PM2.5', 20], ['Sparse', 28.62, 77.22, 'NO2', 20],
  ].map(([station, latitude, longitude, pollutant_id, avg_value]) => ({ station, latitude, longitude, pollutant_id, avg_value, city: 'Delhi', state: 'Delhi', last_update: '30-09-2026 14:00:00' }));
  const stations = normaliseStations(rows);
  assert.deepEqual(stations.map((s) => s.station), ['ITO, Delhi']);
  assert.equal(stations[0].naqi.category, 'very_poor');
  assert.equal(nearestStation(stations, { lat: 28.61, lon: 77.21 }).station, 'ITO, Delhi');
  assert.equal(nearestStation(stations, { lat: 19.08, lon: 72.88 }), null);
  assert.equal(parseCpcbTime('30-09-2026 14:00:00'), '2026-09-30T14:00:00+05:30');
});

// ── Aviation (METAR as returned for VABB, 30 Sep 2026) ──
test('METAR visibility comes from the raw metres group, not miles', () => {
  const m = decodeMetar({
    icaoId: 'VABB', reportTime: '2026-09-30T09:00:00.000Z', wdir: 280, wspd: 10, visib: 2.17, temp: 32,
    rawOb: 'METAR VABB 300900Z 28010KT 3500 HZ SCT020 SCT100 32/26 Q1011 NOSIG', name: 'Mumbai/Shivaji Intl, MM, IN',
  });
  assert.equal(m.visibilityM, 3500);
  assert.deepEqual(m.weather, ['HZ']);
  assert.equal(m.windKmh, 19);
  assert.equal(visibilityM('METAR VIDP 010100Z 00000KT 0100 FG VV001 08/08 Q1020'), 100);
  assert.equal(visibilityM('METAR VIDP 010100Z 00000KT CAVOK 20/10 Q1015'), 10000);
  assert.equal(visibilityM('', '10+'), 16093);
  assert.deepEqual(weatherCodes('METAR X 1Z 0000KT 0800 +TSRA BR'), ['TS', 'RA', 'BR']);
});

test('TAF summary flags fog and the lowest visibility', () => {
  const t = tafSummary({ rawTAF: 'VIDP 300800Z 3009/3018 29008G18KT 5000 HZ NSC BECMG 3015/3017 27005KT 0400 FG', validTimeFrom: 1790758800, validTimeTo: 1790791200 });
  assert.equal(t.fog, true);
  assert.equal(t.minVisibilityM, 400);
});

// ── Snapshot orchestration ──
test('warnings: unavailable when no official source answered, never "no warnings"', () => {
  assert.deepEqual(combineWarnings([], { applicable: true }), { warnings: [], regionalWarnings: [], warningsStatus: 'unavailable' });
  const split = combineWarnings([{ ok: true, data: [{ level: 3, scope: 'state' }, { level: 2, scope: 'place' }, { level: 2 }] }], { applicable: true });
  assert.equal(split.warnings.length, 2, 'IMD district warnings have no scope and count as place');
  assert.equal(split.regionalWarnings.length, 1);
  assert.deepEqual(combineWarnings([{ ok: false, reason: 'timeout' }], { applicable: true }).warningsStatus, 'unavailable');
  assert.equal(combineWarnings([{ ok: true, data: [] }], { applicable: true }).warningsStatus, 'ok');
  assert.equal(combineWarnings([{ ok: true, data: [] }, { ok: false }], { applicable: true }).warningsStatus, 'partial');
  assert.equal(combineWarnings([], { applicable: false }).warningsStatus, 'not_applicable');
  const sorted = combineWarnings([{ ok: true, data: [{ level: 2 }, { level: 4 }] }], { applicable: true }).warnings;
  assert.deepEqual(sorted.map((w) => w.level), [4, 2]);
  assert.equal(inIndia(26.85, 80.95), true);
  assert.equal(inIndia(51.5, -0.12), false, 'London: IMD warnings do not apply (E2)');
});

test('hourly AQI merges onto matching forecast hours', () => {
  const merged = mergeHourlyAqi([{ time: '2026-09-30T14:00:00+05:30', aqi: null }, { time: '2026-09-30T15:00:00+05:30', aqi: null }], {
    hourly: [{ time: '2026-09-30T14:00:00+05:30', aqi: 120 }],
  });
  assert.deepEqual(merged.map((h) => h.aqi), [120, null]);
});

// ── Demo scenarios (T1.5, PRD 24) ──
test('all six scenarios build current, demo-labelled snapshots', () => {
  assert.equal(SCENARIO_IDS.length, 6);
  for (const id of SCENARIO_IDS) {
    const s = buildScenario(id, NOW);
    assert.equal(s.isDemo, true, id);
    assert.equal(s.hourly.length, 60, id);
    assert.equal(s.daily.length, 16, id);
    assert.ok(Date.parse(s.hourly[12].time) <= NOW && NOW - Date.parse(s.hourly[12].time) < 3600e3, `${id}: hour 12 is now`);
    assert.ok(s.warnings.every((w) => w.demo && /Demo of/.test(w.text)), `${id}: warnings say they are demo copies`);
    assert.ok(s.warnings.some((w) => Date.parse(w.validTo) > NOW), `${id}: at least one warning active now`);
  }
  assert.equal(buildScenario('nope'), null);
});

test('scenario details match PRD 24 (Delhi fog and AQI, Goa tides, Mumbai reports)', () => {
  const delhi = buildScenario('delhi-winter-smog-fog', NOW);
  assert.equal(delhi.air.aqi, 356);
  assert.equal(delhi.air.category, 'very_poor');
  const goa = buildScenario('goa-swell-alert', NOW);
  assert.ok(goa.marine.tides.length >= 4, 'Goa has tides');
  assert.deepEqual(buildScenario('mumbai-monsoon-red', NOW).marine.tides, [], 'no tide data means no tides');
  const reports = scenarioReports('mumbai-monsoon-red', NOW);
  assert.equal(reports.length, 8);
  assert.ok(reports.every((r) => r.demo && Date.parse(r.expiresAt) > NOW));
  assert.deepEqual(scenarioReports('lucknow-heatwave', NOW), []);
});

test('scenarios drive the rules engine end to end', () => {
  const run = (id, personas, extra = {}) =>
    runRules(buildContext({ now: NOW, snapshot: buildScenario(id, NOW), personas, ...extra }));
  const mumbai = run('mumbai-monsoon-red', ['commute', 'coast']);
  assert.equal(mumbai[0].kind, 'official');
  assert.equal(mumbai[0].params.level, 4, 'Red first');
  const lucknow = run('lucknow-heatwave', ['work'], { settings: { work: { hours: ['06:00', '23:00'] } } });
  const heatCard = lucknow.find((c) => c.kind === 'official' && c.params.hazard === 'heat_wave');
  assert.ok(heatCard, 'official heat wave card present');
  const delhi = run('delhi-winter-smog-fog', ['health'], { sensitivities: ['asthma'] });
  assert.ok(delhi.some((c) => c.ruleId === 'general.aqiPoor' || c.ruleId === 'health.sensitiveAqi'));
});

// ── Seed data ──
test('seed data: 12 quick-pick cities, 30+ airports with ICAO/IATA, 39 beaches', () => {
  assert.equal(CITIES.length, 12);
  assert.ok(CITIES.every((c) => c.nameHi && inIndia(c.lat, c.lon)));
  assert.ok(AIRPORTS.length >= 30);
  assert.ok(AIRPORTS.every((a) => /^V[AEIO][A-Z]{2}$/.test(a.icao) && /^[A-Z]{3}$/.test(a.iata)));
  assert.equal(new Set(AIRPORTS.map((a) => a.icao)).size, AIRPORTS.length);
  assert.ok(BEACHES.length >= 39);
  assert.ok(BEACHES.every((b) => inIndia(b.lat, b.lon)));
});

test('sun times come from SunCalc in the place offset', () => {
  const s = sunTimes(26.85, 80.95, Date.parse('2026-09-30T12:00:00+05:30'), 330);
  assert.match(s.sunrise, /^2026-09-30T05:5\d:\d{2}\+05:30$/);
  assert.match(s.sunset, /^2026-09-30T17:5\d:\d{2}\+05:30$/);
  assert.ok(s.moonIllumination >= 0 && s.moonIllumination <= 1);
  assert.equal(s.source, 'calculated');
});

// ── Server helpers ──
test('LRU cache: TTL, recency and size bound', () => {
  const c = new LruCache(2);
  c.set('a', 1, 1000, 0);
  c.set('b', 2, 1000, 0);
  assert.equal(c.get('a', { now: 500 }), 1);
  c.set('c', 3, 1000, 600);
  assert.equal(c.get('b', { now: 600 }), undefined, 'least recently used was evicted');
  assert.equal(c.get('a', { now: 2000 }), undefined, 'expired');
  c.set('d', 4, 1000, 0);
  assert.equal(c.get('d', { maxAgeMs: 5000, now: 3000 }), 4, 'maxAgeMs overrides the TTL for fallbacks');
});

test('query parser rejects unknown params and reports every error', () => {
  const schema = { lat: q.number({ min: -90, max: 90, required: true, decimals: 2 }), lang: q.string({ oneOf: ['en', 'hi'], fallback: 'en' }) };
  assert.deepEqual(parseQuery(new URLSearchParams('lat=26.8471'), schema), { lat: 26.85, lang: 'en' });
  try {
    parseQuery(new URLSearchParams('lat=abc&lang=fr&x=1'), schema);
    assert.fail('should throw');
  } catch (e) {
    assert.ok(e instanceof ApiError);
    assert.equal(e.status, 422);
    assert.deepEqual(Object.keys(e.details.fields).sort(), ['lang', 'lat', 'x']);
  }
});
