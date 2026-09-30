// Contract tests for /api/mausam/* (PRD 13.3, 17.4). Handlers are called
// directly with Request objects. Every case here avoids the network: demo
// scenarios, FORCE_FIXTURES, validation failures and disabled providers.

import test from 'node:test';
import assert from 'node:assert/strict';

import { GET as snapshotGET } from '../src/app/api/mausam/snapshot/route.js';
import { GET as warningsGET } from '../src/app/api/mausam/warnings/route.js';
import { GET as searchGET } from '../src/app/api/mausam/places/search/route.js';
import { GET as airportGET } from '../src/app/api/mausam/airport/route.js';
import { GET as climatologyGET } from '../src/app/api/mausam/climatology/route.js';
import { GET as healthGET } from '../src/app/api/mausam/health/route.js';

const req = (path) => new Request(`http://localhost${path}`);
const call = async (handler, path) => {
  const res = await handler(req(path));
  return { res, body: await res.json() };
};

function withEnv(vars, fn) {
  return async () => {
    const saved = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
    Object.assign(process.env, vars);
    try {
      await fn();
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  };
}

test('snapshot: demo scenario is served, cacheable and labelled', async () => {
  const { res, body } = await call(snapshotGET, '/api/mausam/snapshot?lat=19.08&lon=72.88&demo=mumbai-monsoon-red');
  assert.equal(res.status, 200);
  assert.match(res.headers.get('cache-control'), /^public, s-maxage=300/);
  assert.ok(res.headers.get('x-request-id'));
  assert.equal(body.isDemo, true);
  assert.equal(body.scenario, 'mumbai-monsoon-red');
  assert.equal(body.warnings[0].level, 4);
});

test(
  'T1.3: FORCE_FIXTURES returns demo weather, and warnings stay "unavailable"',
  withEnv({ FORCE_FIXTURES: 'true' }, async () => {
    for (const [lat, lon] of [[28.61, 77.21], [19.08, 72.88], [13.08, 80.27]]) {
      const { res, body } = await call(snapshotGET, `/api/mausam/snapshot?lat=${lat}&lon=${lon}`);
      assert.equal(res.status, 200);
      assert.equal(body.isDemo, true);
      assert.equal(body.warningsStatus, 'unavailable', 'fixture warnings are never presented as live');
      assert.deepEqual(body.warnings, []);
      assert.equal(body.place.lat, lat);
      assert.equal(body.hourly.length, 60);
    }
  }),
);

test('snapshot: bad input is a 422 listing every field, never cached', async () => {
  const { res, body } = await call(snapshotGET, '/api/mausam/snapshot?lat=200&include=air,bogus&extra=1');
  assert.equal(res.status, 422);
  assert.equal(res.headers.get('cache-control'), 'no-store, private');
  assert.equal(body.error.code, 'validation_failed');
  assert.deepEqual(Object.keys(body.error.details.fields).sort(), ['extra', 'include', 'lat', 'lon']);
  const unknownDemo = await call(snapshotGET, '/api/mausam/snapshot?lat=1&lon=1&demo=../../etc');
  assert.equal(unknownDemo.res.status, 422);
});

test(
  'warnings: with no official source configured the status is "unavailable"',
  withEnv({ IMD_API_ENABLED: 'false', SACHET_FEED_URLS: '' }, async () => {
    const { res, body } = await call(warningsGET, '/api/mausam/warnings?lat=26.85&lon=80.95');
    assert.equal(res.status, 200);
    assert.equal(body.warningsStatus, 'unavailable');
    assert.deepEqual(body.warnings, []);
    assert.ok(body.checkedAt);
  }),
);

test('warnings: outside India they are "not_applicable" (E2)', async () => {
  const { body } = await call(warningsGET, '/api/mausam/warnings?lat=51.51&lon=-0.13');
  assert.equal(body.warningsStatus, 'not_applicable');
});

test('places: PIN codes ask for a place name; short queries are rejected', async () => {
  const { res, body } = await call(searchGET, '/api/mausam/places/search?q=226001');
  assert.equal(res.status, 200);
  assert.deepEqual(body.results, []);
  assert.equal(body.hint, 'place_name');
  assert.equal((await call(searchGET, '/api/mausam/places/search?q=a')).res.status, 422);
});

test('airport: ICAO codes are validated before any upstream call', async () => {
  assert.equal((await call(airportGET, '/api/mausam/airport')).res.status, 422);
  assert.equal((await call(airportGET, '/api/mausam/airport?icao=DEL')).res.status, 422);
  assert.equal((await call(airportGET, '/api/mausam/airport?icao=VIDP,VABB,VOBL,VOMM,VECC')).res.status, 422);
});

test('climatology: impossible dates are a 422', async () => {
  const { res, body } = await call(climatologyGET, '/api/mausam/climatology?lat=26.91&lon=75.79&month=2&day=31');
  assert.equal(res.status, 422);
  assert.ok(body.error.details.fields.day);
});

test('health: reports configuration without secrets', async () => {
  const { res, body } = await call(healthGET, '/api/mausam/health');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store, private');
  assert.equal(typeof body.configured.imd, 'boolean');
  assert.equal(body.persistence.adapter, 'in-memory');
  assert.equal(body.persistence.durable, false);
  assert.ok(!JSON.stringify(body).includes('api-key'));
});
