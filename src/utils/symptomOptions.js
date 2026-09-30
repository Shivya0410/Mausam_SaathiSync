// Shared, fixed symptom vocabulary for the menstrual cycle tracker. Used by
// both the server-side validator (src/server/domains/cycleLogs.js) and the
// client tracker UI, so the two never drift apart. A closed list rather than
// free text keeps this a wellness log, not a place to type a diagnosis.
export const SYMPTOM_OPTIONS = [
  "cramps",
  "headache",
  "fatigue",
  "mood_changes",
  "bloating",
  "acne",
  "back_pain",
  "nausea",
];

export const SYMPTOM_LABELS = {
  cramps: "Cramps",
  headache: "Headache",
  fatigue: "Fatigue",
  mood_changes: "Mood changes",
  bloating: "Bloating",
  acne: "Acne",
  back_pain: "Back pain",
  nausea: "Nausea",
};

export const SYMPTOM_LABELS_HI = {
  cramps: "ऐंठन",
  headache: "सिरदर्द",
  fatigue: "थकान",
  mood_changes: "मूड बदलाव",
  bloating: "पेट फूलना",
  acne: "मुँहासे",
  back_pain: "पीठ दर्द",
  nausea: "मतली",
};

export function symptomLabel(symptom, lang) {
  if (String(lang).startsWith("hi")) return SYMPTOM_LABELS_HI[symptom] ?? SYMPTOM_LABELS[symptom] ?? symptom;
  return SYMPTOM_LABELS[symptom] ?? symptom;
}
