// Simple, rule-based wellness observations derived from a person's own
// logged cycle entries. Deliberately not ML, not a diagnosis, not a risk
// score - just arithmetic over symptoms the person already recorded, plus
// pointers toward relevant education content and a standing reminder to
// consult a professional when something feels persistent or concerning.
//
// A pure function: given the same entries, it always returns the same
// insights, and it has no side effects of its own.

import { SYMPTOM_LABELS } from "./symptomOptions";

// How many of the most recent logged cycles to look at for a "repeated
// symptom" observation, and how many of those need the symptom present
// before it's worth mentioning.
const RECENT_WINDOW = 6;
const REPEAT_THRESHOLD = 2;

const PROFESSIONAL_ADVICE_NOTE =
  "These are general wellness observations, not a medical diagnosis. If any symptom feels persistent or concerning, consider speaking with a healthcare professional.";

/**
 * @param {Array<{ symptoms?: string[] }>} entries logged cycles, any order
 * @returns {string[]} short, plain-language observations
 */
export function getWellnessInsights(entries = []) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return [
      "You haven't logged anything yet. Explore the Women's Health Education section below, or log your first cycle to start building a private history.",
      PROFESSIONAL_ADVICE_NOTE,
    ];
  }

  const recent = entries.slice(-RECENT_WINDOW);
  const counts = {};
  for (const entry of recent) {
    for (const symptom of entry.symptoms ?? []) {
      counts[symptom] = (counts[symptom] ?? 0) + 1;
    }
  }

  const repeated = Object.entries(counts)
    .filter(([, count]) => count >= REPEAT_THRESHOLD)
    .sort((a, b) => b[1] - a[1]);

  const insights = [];

  if (repeated.length > 0) {
    const [topSymptom, count] = repeated[0];
    const label = (SYMPTOM_LABELS[topSymptom] ?? topSymptom).toLowerCase();
    insights.push(
      `You've logged ${label} in ${count} of your last ${recent.length} cycles. The Menstrual Health and PCOS & Hormonal Health sections below may be worth a look.`
    );
  } else {
    const hasAnySymptoms = recent.some((entry) => (entry.symptoms ?? []).length > 0);
    if (hasAnySymptoms) {
      insights.push(
        "No single symptom stands out yet across your recent cycles - keep logging to build a clearer picture over time."
      );
    } else {
      insights.push(
        "You're logging cycles without symptoms so far. If that changes, noting them can help you spot patterns."
      );
    }
  }

  insights.push(
    "General wellbeing areas like sleep, nutrition, exercise and stress management can all influence how your cycle feels - see the Education section below."
  );

  insights.push(PROFESSIONAL_ADVICE_NOTE);

  return insights;
}
