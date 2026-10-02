import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weatherStateFor, timeOfDayKey } from '../src/lib/mausam/weatherState.js';

test('alert wins over everything', () => {
  assert.equal(weatherStateFor({ wmo: 0, isDay: true, warningLevel: 4 }), 'alert');
  assert.equal(weatherStateFor({ wmo: 95, isDay: true, warningLevel: 3 }), 'alert');
});

test('storm, rain, fog, snow from WMO codes', () => {
  assert.equal(weatherStateFor({ wmo: 95, isDay: true }), 'storm');
  assert.equal(weatherStateFor({ wmo: 61, isDay: true }), 'rain');
  assert.equal(weatherStateFor({ wmo: 51, isDay: true }), 'rain');
  assert.equal(weatherStateFor({ wmo: 45, isDay: true }), 'fog');
  assert.equal(weatherStateFor({ wmo: 71, isDay: true }), 'snow');
});

test('heat from dynamic API temperatures', () => {
  assert.equal(weatherStateFor({ wmo: 0, isDay: true, tempC: 41, feelsC: 40 }), 'heat');
  assert.equal(weatherStateFor({ wmo: 1, isDay: true, tempC: 30, feelsC: 44 }), 'heat');
});

test('poor AQI state', () => {
  assert.equal(weatherStateFor({ wmo: 3, isDay: true, aqi: 268 }), 'poor-aqi');
});

test('night and cloudy fallbacks', () => {
  assert.equal(weatherStateFor({ wmo: 0, isDay: false }), 'night');
  assert.equal(weatherStateFor({ wmo: 3, isDay: true }), 'cloudy');
  assert.equal(weatherStateFor({ wmo: 0, isDay: true, tempC: 28 }), 'sunny');
});

test('time of day keys are dynamic', () => {
  assert.equal(timeOfDayKey(6), 'morning');
  assert.equal(timeOfDayKey(13), 'afternoon');
  assert.equal(timeOfDayKey(18), 'evening');
  assert.equal(timeOfDayKey(23), 'night');
});
