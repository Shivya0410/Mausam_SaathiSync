/**
 * Cloud classes for Sky Snap (PRD 11.1, 26.5): CCSN dataset's 11 classes.
 * Plain names and meanings are i18n keys (cloudTypes.<code>.*), added with
 * the Sky Snap page in Part 3. `storm` marks classes that warrant a
 * "go indoors" action.
 */
export const CLOUD_TYPES = [
  { code: 'Cb', altitude: 'low_to_high', storm: true },
  { code: 'Ns', altitude: 'low_to_mid', storm: false },
  { code: 'Cu', altitude: 'low', storm: false },
  { code: 'Sc', altitude: 'low', storm: false },
  { code: 'St', altitude: 'low', storm: false },
  { code: 'As', altitude: 'mid', storm: false },
  { code: 'Ac', altitude: 'mid', storm: false },
  { code: 'Ci', altitude: 'high', storm: false },
  { code: 'Cs', altitude: 'high', storm: false },
  { code: 'Cc', altitude: 'high', storm: false },
  { code: 'Ct', altitude: 'high', storm: false },
];
