// Camera feature logic (PRD 11.1 to 11.3, 20.11, 27.9): dark channel haze
// score on synthetic images, confidence words, Sky Snap and Jal-Bharav
// decisions, and the forecast storm context. Pure; no browser.

import test from 'node:test';
import assert from 'node:assert/strict';

import { hazeScore, bandOf, minFilter, fogReportLabel, HAZE_BANDS } from '../src/lib/cv/darkChannel.js';
import { confidenceWord, skyDecision, floodDecision, stormContext } from '../src/lib/cv/decide.js';

function image(w, h, fn) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = fn(x, y);
      const i = (y * w + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }
  return { data, width: w, height: h };
}

test('uniform light grey reads as heavy haze', () => {
  const r = hazeScore(image(80, 60, () => [200, 200, 200]));
  assert.equal(r.tooDark, false);
  assert.ok(r.score > 0.8, `score ${r.score}`);
  assert.equal(r.band, 'very_dense_fog');
});

test('a saturated, high-contrast scene reads as clear', () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // Colourful noise: each pixel has at least one near-zero channel, like a
  // clear, saturated scene.
  const r = hazeScore(image(80, 60, () => {
    const c = Math.floor(rnd() * 3);
    const px = [255 * rnd(), 255 * rnd(), 255 * rnd()];
    px[c] = 5;
    return px;
  }));
  assert.ok(r.score < 0.25, `score ${r.score}`);
  assert.equal(r.band, 'clear');
});

test('a dark photo is refused, not guessed', () => {
  const r = hazeScore(image(40, 30, () => [20, 25, 30]));
  assert.deepEqual(r, { score: null, band: null, tooDark: true });
});

test('haze bands follow the PRD boundaries', () => {
  assert.equal(bandOf(0.1), 'clear');
  assert.equal(bandOf(0.25), 'mist');
  assert.equal(bandOf(0.5), 'moderate_fog');
  assert.equal(bandOf(0.7), 'dense_fog');
  assert.equal(bandOf(0.95), 'very_dense_fog');
  assert.equal(HAZE_BANDS.length, 5);
  assert.equal(fogReportLabel('dense_fog'), 'dense');
});

test('minFilter takes the minimum over the window', () => {
  const src = Float32Array.from([9, 9, 9, 9, 1, 9, 9, 9, 9]);
  const out = minFilter(src, 3, 3, 1);
  assert.ok(out.every((v) => v === 1));
});

test('confidence words match PRD 20.11', () => {
  assert.equal(confidenceWord(0.87), 'veryLikely');
  assert.equal(confidenceWord(0.7), 'likely');
  assert.equal(confidenceWord(0.6), 'possibly');
  assert.equal(confidenceWord(0.5), 'notSure');
});

test('Sky Snap accepts at 0.55, mentions a close second and rejects non-sky', () => {
  assert.deepEqual(skyDecision([{ label: 'Cu', p: 0.4 }, { label: 'Sc', p: 0.3 }]).status, 'unsure');
  const ok = skyDecision([{ label: 'Sc', p: 0.2 }, { label: 'Cb', p: 0.7 }]);
  assert.equal(ok.status, 'ok');
  assert.equal(ok.label, 'Cb');
  assert.equal(ok.alt, null);
  const close = skyDecision([{ label: 'Sc', p: 0.58 }, { label: 'Ac', p: 0.46 }]);
  assert.equal(close.alt.label, 'Ac');
  assert.equal(skyDecision([{ label: 'none', p: 0.9 }, { label: 'Cu', p: 0.1 }]).status, 'notSky');
  assert.equal(skyDecision([]).status, 'unsure');
});

test('Jal-Bharav thresholds: 0.70 AI-verified, 0.50 unverified, below rejected', () => {
  const probs = (p) => [{ label: 'flooded_street', p }, { label: 'wet_not_flooded', p: (1 - p) * 0.7 }, { label: 'not_relevant', p: (1 - p) * 0.3 }];
  assert.equal(floodDecision(probs(0.91)).status, 'ai_verified');
  assert.equal(floodDecision(probs(0.7)).status, 'ai_verified');
  assert.equal(floodDecision(probs(0.6)).status, 'unverified');
  const no = floodDecision(probs(0.3));
  assert.equal(no.status, 'reject');
  assert.equal(no.other.label, 'wet_not_flooded');
});

test('stormContext finds forecast thunder and an IMD thunder nowcast', () => {
  const hours = [
    { time: '2026-09-30T15:00:00+05:30', wmo: 3, precipProb: 20 },
    { time: '2026-09-30T17:00:00+05:30', wmo: 95, precipProb: 60 },
  ];
  const w = [{ source: 'imd_nowcast', hazard: 'thunderstorm', level: 3 }];
  const c = stormContext(hours, w);
  assert.equal(c.stormAt, '2026-09-30T17:00:00+05:30');
  assert.equal(c.nowcast.level, 3);
  assert.deepEqual(stormContext([{ time: 'x', wmo: 1, precipProb: 0 }]), { stormAt: null, nowcast: null });
});
