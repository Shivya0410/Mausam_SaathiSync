/**
 * Model cards for /about#models (PRD 11.6). Text fields are i18n keys under
 * modelCards.<id>.*. `accuracy` must be a MEASURED value with its test-set
 * size, or null; never an expected figure. Update after training (see
 * ml/README.md).
 */
export const MODEL_CARDS = [
  {
    id: 'skySnap',
    path: '/models/sky-snap/',
    kind: 'deep',
    architecture: 'MobileNetV3-Small, transfer learning',
    inputSize: '224 × 224',
    classes: 11,
    accuracy: null, // e.g. { top1: 0.81, testImages: 382 } once measured
    sizeMB: null,
    version: null,
  },
  {
    id: 'jalBharav',
    path: '/models/jal-bharav/',
    kind: 'deep',
    architecture: 'MobileNetV3-Small, transfer learning',
    inputSize: '224 × 224',
    classes: 3,
    accuracy: null,
    sizeMB: null,
    version: null,
  },
  {
    id: 'dhundh',
    path: null,
    kind: 'classical',
    architecture: 'Dark channel prior (He, Sun and Tang, 2009)',
    inputSize: '320 px wide',
    classes: 5,
    accuracy: null,
    sizeMB: 0,
    version: 'dhundh-dcp-0.1',
  },
];
