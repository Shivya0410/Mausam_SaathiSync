# On-device models

Mausam Saathi runs two image classifiers in the browser with TensorFlow.js
(PRD section 11). **No trained model is included in this repository.** The
pages detect this and offer an honest manual path (the user picks the cloud
type, or confirms the flooding themselves); manual reports are always stored
as "unverified" and never as AI-verified.

| Model | Folder served at | Classes | Script |
| --- | --- | --- | --- |
| Sky Snap | `public/models/sky-snap/` | `Ac As Cb Cc Ci Cs Ct Cu Ns Sc St` (+ optional `none`) | `ml/sky_snap/train.py` |
| Jal-Bharav Watch | `public/models/jal-bharav/` | `flooded_street wet_not_flooded not_relevant` | `ml/jal_bharav/train.py` |

The Dhundh Meter (fog) needs no model: it is the dark channel prior in
`src/lib/cv/darkChannel.js`. Its bands are provisional until calibrated on
30 to 50 labelled photos (PRD 11.3).

## Before you train

- **Check the dataset licences.** CCSN (`upuil/CCSN-Database`) and the flood
  image sets named in the PRD have licences marked VERIFY. Do not redistribute
  images or ship a model trained on them until the licence allows it.
- Split by group (perceptual-hash de-duplication first) so near-duplicate
  photos do not leak between train and test.
- Keep a held-out test set and record per-class recall and the confusion
  matrix. The model card on `/about#models` must show **measured** numbers
  only (edit `src/data/modelCards.js`).

## Train and install

```bash
python -m venv .venv && . .venv/bin/activate
pip install tensorflow==2.15 tensorflowjs==4.22
python ml/sky_snap/train.py --data /path/to/ccsn --out ml/sky_snap/out
tensorflowjs_converter --input_format=keras --quantize_uint8 '*' \
  ml/sky_snap/out/sky_snap.keras public/models/sky-snap/
cp ml/sky_snap/out/labels.json ml/sky_snap/out/config.json public/models/sky-snap/
```

Each model folder needs `model.json`, the weight shards, `labels.json` (class
names in output order) and optionally `config.json`:

```json
{ "inputSize": 224, "range": "0-255", "version": "skysnap-mnv3s-1.0" }
```

`range` is the pixel range the model expects: `0-255` for MobileNetV3 with
`include_preprocessing=True`, `-1-1` for MobileNetV2 `preprocess_input`, or
`0-1`. The loader is `src/lib/cv/classifier.js`; it supports both layers and
graph models. Target: under 6 MB per model and under 700 ms per photo on a
mid-range Android phone (PRD 13.8).
