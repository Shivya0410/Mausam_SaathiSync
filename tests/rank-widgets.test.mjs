import test from 'node:test';
import assert from 'node:assert/strict';

import { WIDGETS, WIDGET_IDS, WIDGET_HAZARDS } from '../src/config/widgets.js';
import { PERSONAS, PERSONA_IDS } from '../src/config/personas.js';
import { rankWidgets, widgetUrgency } from '../src/lib/mausam/rankWidgets.js';

const ids = (list) => list.map((w) => w.id);
const primary = (id) => [{ id, role: 'primary' }];
const rank = (over) =>
  rankWidgets({ widgets: WIDGETS, personas: primary('citizen'), season: 'monsoon', timeOfDay: 'afternoon', ...over });

test('registry has all 35 widgets with a weight for every persona', () => {
  assert.equal(WIDGETS.length, 35);
  assert.equal(new Set(WIDGET_IDS).size, 35);
  for (const w of WIDGETS) {
    assert.deepEqual(Object.keys(w.personas).sort(), [...PERSONA_IDS].sort(), w.id);
    assert.ok(['full', 'half', 'third'].includes(w.size.mobile) && ['full', 'half', 'third'].includes(w.size.desktop), w.id);
    assert.equal(w.titleKey, `widgets.${w.id}.title`);
  }
  for (const id of Object.keys(WIDGET_HAZARDS)) assert.ok(WIDGET_IDS.includes(id), id);
  assert.equal(PERSONAS.filter((p) => p.tile).length, 9, 'nine tiles; fisher shares the beach tile');
});

test('health persona in January with AQI 350 ranks aqi first', () => {
  const urgency = widgetUrgency({ widgetHazards: WIDGET_HAZARDS, air: { aqi: 350 } });
  const list = rank({ personas: primary('health'), season: 'winter', timeOfDay: 'morning', urgency });
  assert.equal(list[0].id, 'aqi');
  assert.equal(list[0].rankReason.urgent, 'official');
  assert.equal(list[0].rankReason.season, 'winter');
});

test('fitness persona at 5 AM ranks runWindow first', () => {
  assert.equal(rank({ personas: primary('fitness'), timeOfDay: 'morning' })[0].id, 'runWindow');
});

test('coast persona with an active coastal warning ranks seaState above tides', () => {
  const urgency = widgetUrgency({ widgetHazards: WIDGET_HAZARDS, warnings: [{ hazard: 'high_waves', level: 3 }] });
  const order = ids(rank({ personas: primary('coast'), urgency }));
  assert.equal(order[0], 'seaState');
  assert.ok(order.indexOf('seaState') < order.indexOf('tides'));
});

test('a pinned widget stays first even with a lower score', () => {
  const list = rank({ personas: primary('farm'), layout: { pinned: ['readyStreak'] } });
  assert.equal(list[0].id, 'readyStreak');
  assert.equal(list[0].pinned, true);
});

test('a pinned widget shows even when no persona weights it', () => {
  assert.ok(ids(rank({ personas: primary('farm'), layout: { pinned: ['nextTrip'] } })).includes('nextTrip'));
});

test('a hidden widget never appears', () => {
  assert.ok(!ids(rank({ layout: { hidden: ['hourly', 'aqi'] } })).includes('aqi'));
});

test('citizen persona shows hourly within the first 6 and daily within the first 10', () => {
  for (const personas of [primary('citizen'), primary('farm'), primary('travel'), primary('events')]) {
    const order = ids(rank({ personas }));
    assert.ok(order.indexOf('hourly') <= 5, `${personas[0].id}: hourly at ${order.indexOf('hourly')}`);
    assert.ok(order.indexOf('daily') <= 9, `${personas[0].id}: daily at ${order.indexOf('daily')}`);
  }
});

test('widgets with zero weight for every persona are left out', () => {
  const order = ids(rank({ personas: primary('commute') }));
  assert.ok(!order.includes('soil'));
  assert.ok(order.includes('commuteNow'));
});

test('secondary personas count at 70%', () => {
  const list = rank({ personas: [{ id: 'commute', role: 'primary' }, { id: 'farm', role: 'secondary' }] });
  const soil = list.find((w) => w.id === 'soil');
  assert.equal(soil.score, 59.5);
  assert.ok(ids(list).indexOf('commuteNow') <= 2);
});

test('habit boost is capped at 20%', () => {
  const base = rank({ personas: primary('farm') }).find((w) => w.id === 'soil').score;
  const tapped = rank({ personas: primary('farm'), usage: { widgetTaps: { soil: 500 } } }).find((w) => w.id === 'soil').score;
  assert.ok(Math.abs(tapped / base - 1.2) < 0.001);
});

test('manual order is respected for moved widgets', () => {
  const auto = ids(rank({ personas: primary('farm') }));
  const a = auto.indexOf('soil');
  const b = auto.indexOf('sprayWindow');
  const manual = ids(rank({ personas: primary('farm'), layout: { order: ['sprayWindow', 'soil'] } }));
  assert.equal(manual.indexOf('sprayWindow'), Math.min(a, b));
  assert.equal(manual.indexOf('soil'), Math.max(a, b));
});

test('urgency: official beats tip; tip severity 2 boosts 1.3', () => {
  const u = widgetUrgency({
    widgetHazards: WIDGET_HAZARDS,
    warnings: [{ hazard: 'heat_wave', level: 3 }, { hazard: 'dense_fog', level: 1 }],
    cards: [{ kind: 'tip', severity: 2, hazard: 'fog' }, { kind: 'tip', severity: 1, hazard: 'thunder' }],
  });
  assert.equal(u.heatDanger, 1.8);
  assert.equal(u.visibility, 1.3);
  assert.equal(u.lightning, undefined);
});
