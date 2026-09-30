// Mock challenge catalogue for the Challenges Hub (/challenges).
// Static demo data (like communityFeed/fitnessEvents): daysRemaining counts
// down from a fixed launch offset so cards never rot into "ended".
// Cover art is CSS (gradient + icon) — no external images by policy.

export const CHALLENGE_CATEGORIES = ["steps", "workout", "yoga", "nutrition"];

export const CATEGORY_META = {
  steps: { icon: "fa-solid fa-shoe-prints", color: "#0288d1", labelKey: "chal.catSteps" },
  workout: { icon: "fa-solid fa-dumbbell", color: "#e65100", labelKey: "chal.catWorkout" },
  yoga: { icon: "fa-solid fa-spa", color: "#7e57c2", labelKey: "chal.catYoga" },
  nutrition: { icon: "fa-solid fa-apple-whole", color: "#2e7d32", labelKey: "chal.catNutrition" },
};

export const CHALLENGES = [
  {
    id: "september-steps",
    category: "steps",
    title: "September Steps Challenge",
    description: "Walk 8,000 steps a day for 30 days. Small steps, big change.",
    durationDays: 30,
    startedDaysAgo: 12,
    participants: 12840,
    xp: 500,
    featured: true,
  },
  {
    id: "yoga-consistency",
    category: "yoga",
    title: "Yoga Consistency Challenge",
    description: "20 minutes of yoga every morning for 21 days. Breathe, flow, repeat.",
    durationDays: 21,
    startedDaysAgo: 5,
    participants: 5320,
    xp: 350,
  },
  {
    id: "strength-foundations",
    category: "workout",
    title: "Strength Challenge",
    description: "Three full-body strength sessions a week for 6 weeks. Progressive overload, desi style.",
    durationDays: 42,
    startedDaysAgo: 9,
    participants: 3110,
    xp: 600,
  },
  {
    id: "healthy-thali",
    category: "nutrition",
    title: "Healthy Meal Challenge",
    description: "Build a balanced thali — protein, millet, veggies — for 14 days straight.",
    durationDays: 14,
    startedDaysAgo: 3,
    participants: 7860,
    xp: 300,
  },
  {
    id: "morning-5k",
    category: "steps",
    title: "Morning 5K Streak",
    description: "Run or brisk-walk 5 km before 9 AM, 5 days a week for a month.",
    durationDays: 30,
    startedDaysAgo: 20,
    participants: 2940,
    xp: 450,
  },
  {
    id: "plank-party",
    category: "workout",
    title: "Plank Party",
    description: "Add 10 seconds to your plank every day for 15 days. Core of steel.",
    durationDays: 15,
    startedDaysAgo: 2,
    participants: 11230,
    xp: 250,
  },
];

export function daysRemaining(ch) {
  return Math.max(ch.durationDays - ch.startedDaysAgo, 0);
}

export function getChallenge(id) {
  return CHALLENGES.find((c) => c.id === id) || null;
}

export function featuredChallenge() {
  return CHALLENGES.find((c) => c.featured) || CHALLENGES[0];
}

export function formatParticipants(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${n}`;
}
