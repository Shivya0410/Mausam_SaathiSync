"use client";

// On-device image classifier loader (PRD 11.1, 11.2, 27.10). TF.js is
// imported dynamically so it never enters the homepage bundle (PRD 13.8).
//
// A model lives in /public/models/<name>/ as model.json + weight shards +
// labels.json, with an optional config.json, and its name must be listed
// in /public/models/index.json. Optional config.json:
//   { "inputSize": 224, "range": "0-255" | "0-1" | "-1-1", "version": "..." }
// When the files are missing the loader rejects with code 'not_installed',
// and the pages offer an honest manual path instead of guessing.

const cache = new Map();

// public/models/index.json lists installed models: { "installed": ["sky-snap"] }.
// Reading it (always present) avoids probing for files that may not exist.
let indexPromise = null;
async function installed(name) {
  if (!indexPromise) {
    indexPromise = fetch('/models/index.json', { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : { installed: [] }))
      .catch(() => ({ installed: [] }));
  }
  const idx = await indexPromise;
  return Array.isArray(idx.installed) && idx.installed.includes(name);
}

export function createClassifier(name) {
  const base = `/models/${name}`;
  let promise = null;

  async function load() {
    if (!(await installed(name))) {
      const e = new Error(`Model ${name} is not installed`);
      e.code = 'not_installed';
      throw e;
    }
    const tf = await import('@tensorflow/tfjs');
    await import('@tensorflow/tfjs-backend-webgl');
    await tf.ready();
    const [manifest, labels, config] = await Promise.all([
      fetch(`${base}/model.json`).then((r) => r.json()),
      fetch(`${base}/labels.json`).then((r) => r.json()),
      fetch(`${base}/config.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({})),
    ]);
    const model =
      manifest.format === 'layers-model' ? await tf.loadLayersModel(`${base}/model.json`) : await tf.loadGraphModel(`${base}/model.json`);
    const size = config.inputSize || 224;
    tf.tidy(() => {
      model.predict(tf.zeros([1, size, size, 3]));
    });
    return { tf, model, labels, size, range: config.range || '0-255', version: config.version || `${name}-unversioned` };
  }

  return {
    name,
    /** Start loading; safe to call many times (PRD 20.10 warm-up). */
    warmUp() {
      if (!promise) {
        promise = load().catch((e) => {
          promise = null;
          throw e;
        });
      }
      return promise;
    },
    /** @returns {Promise<{ probs: Array<{label, p}>, version: string, ms: number }>} */
    async classify(canvas) {
      const { tf, model, labels, size, range, version } = await this.warmUp();
      const t0 = performance.now();
      const out = tf.tidy(() => {
        const img = tf.browser.fromPixels(canvas).toFloat();
        const [h, w] = img.shape;
        const side = Math.min(h, w);
        const box = [[(h - side) / 2 / h, (w - side) / 2 / w, (h + side) / 2 / h, (w + side) / 2 / w]];
        let x = tf.image.cropAndResize(img.expandDims(0), box, [0], [size, size]);
        if (range === '0-1') x = x.div(255);
        else if (range === '-1-1') x = x.div(127.5).sub(1);
        const y = model.predict(x);
        return (Array.isArray(y) ? y[0] : y).squeeze();
      });
      const values = await out.data();
      out.dispose();
      const probs = Array.from(values).map((p, i) => ({ label: labels[i], p }));
      return { probs, version, ms: Math.round(performance.now() - t0) };
    },
    /** Tensors in use (for the "no leak across 10 analyses" check). */
    async memory() {
      if (!promise) return null;
      const { tf } = await promise;
      return tf.memory().numTensors;
    },
  };
}

export function classifier(name) {
  if (!cache.has(name)) cache.set(name, createClassifier(name));
  return cache.get(name);
}
