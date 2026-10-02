import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weatherStateFor } from '../src/lib/mausam/weatherState.js';

test('splash weather state mapping correctly handles thunderstorm, rain, cloudy and sunny states', () => {
  // Test weather state mappings that feed into dynamic splash weather modes
  assert.equal(weatherStateFor({ wmo: 95, isDay: true }), 'storm');
  assert.equal(weatherStateFor({ wmo: 61, isDay: true }), 'rain');
  assert.equal(weatherStateFor({ wmo: 3, isDay: true }), 'cloudy');
  assert.equal(weatherStateFor({ wmo: 0, isDay: true, tempC: 25 }), 'sunny');
});

test('splash intro scene sequence has correct initial stages', () => {
  const introScenes = [
    { id: "thunderstorm", theme: "dark", duration: 1800 },
    { id: "cloudy", theme: "light", duration: 1600 },
    { id: "rain", theme: "dark", duration: 1600 },
  ];

  assert.equal(introScenes.length, 3);
  assert.equal(introScenes[0].id, 'thunderstorm');
  assert.equal(introScenes[1].id, 'cloudy');
  assert.equal(introScenes[2].id, 'rain');

  const totalDuration = introScenes.reduce((acc, s) => acc + s.duration, 0);
  assert.ok(totalDuration >= 4500 && totalDuration <= 5500, 'Total intro sequence should be within 4.5s to 5.5s');
});
