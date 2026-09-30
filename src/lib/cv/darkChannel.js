// Dhundh Meter: haze estimate from one photo with the dark channel prior
// (He, Sun and Tang, 2009; PRD 11.3 and 27.9). Pure; runs on ImageData-like
// input { data, width, height }. Downscale to ~320 px wide before calling.
//
// Bands are PROVISIONAL (PRD 11.3): they must be calibrated on 30 to 50
// labelled photos before anyone relies on them, and the UI always labels
// the result "Estimate from your photo" next to the forecast visibility.

export const HAZE_BANDS = [
  { band: 'clear', max: 0.25, visibility: '> 2 km' },
  { band: 'mist', max: 0.45, visibility: '1 to 2 km' },
  { band: 'moderate_fog', max: 0.65, visibility: '200 to 1,000 m' },
  { band: 'dense_fog', max: 0.8, visibility: '50 to 200 m' },
  { band: 'very_dense_fog', max: Infinity, visibility: '< 50 m' },
];

export const TOO_DARK = 40;

export function bandOf(score) {
  return HAZE_BANDS.find((b) => score < b.max).band;
}

/** Report label for a band (matches the fog report labels). */
export function fogReportLabel(band) {
  return { clear: 'clear', mist: 'light', moderate_fog: 'moderate', dense_fog: 'dense', very_dense_fog: 'very_dense' }[band];
}

/** Separable min filter (horizontal then vertical), radius r. */
export function minFilter(src, w, h, r) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 255;
      const a = Math.max(0, x - r);
      const b = Math.min(w - 1, x + r);
      for (let k = a; k <= b; k++) if (src[y * w + k] < m) m = src[y * w + k];
      tmp[y * w + x] = m;
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let m = 255;
      const a = Math.max(0, y - r);
      const b = Math.min(h - 1, y + r);
      for (let k = a; k <= b; k++) if (tmp[k * w + x] < m) m = tmp[k * w + x];
      out[y * w + x] = m;
    }
  }
  return out;
}

/**
 * Haze score 0..1 (higher is hazier).
 * @returns {{ score: number|null, band: string|null, tooDark: boolean }}
 */
export function hazeScore(img, { patch = 15, omega = 0.95 } = {}) {
  const { data, width, height } = img;
  const n = width * height;
  const minRGB = new Float32Array(n);
  let brightness = 0;
  for (let i = 0; i < n; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    minRGB[i] = Math.min(r, g, b);
    brightness += (r + g + b) / 3;
  }
  // Night, headlights: the prior is unreliable (PRD 11.3).
  if (brightness / n < TOO_DARK) return { score: null, band: null, tooDark: true };

  const dark = minFilter(minRGB, width, height, Math.floor(patch / 2));

  // Atmospheric light A: mean intensity of the brightest 0.1% dark-channel pixels.
  const k = Math.max(1, Math.floor(n * 0.001));
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => dark[b] - dark[a]).slice(0, k);
  let A = 0;
  for (const i of order) A += (data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3;
  A = A / k || 255;

  // Transmission over the lower two-thirds (near field, not the sky).
  const start = Math.floor(height / 3);
  const ts = new Float32Array((height - start) * width);
  let j = 0;
  for (let y = start; y < height; y++) {
    for (let x = 0; x < width; x++) ts[j++] = 1 - omega * Math.min(1, dark[y * width + x] / A);
  }
  ts.sort();
  const median = ts[Math.floor(ts.length / 2)];
  const score = Math.max(0, Math.min(1, 1 - median));
  return { score: Math.round(score * 1000) / 1000, band: bandOf(score), tooDark: false };
}
