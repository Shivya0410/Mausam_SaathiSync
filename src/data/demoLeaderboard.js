// FICTIONAL DEMO LEADERBOARD FIXTURES — NOT REAL USERS.
//
// These rows exist only so the /leaderboard filter UI (scope × category) can
// be exercised without a persistent backend, public-profile consent, or any
// real-user aggregation. They must ALWAYS render behind an explicit demo
// label (see LeaderboardView) and must NEVER be mixed with real-user state,
// which stays an honest empty state until a durable backend + opt-in consent
// + privacy review exist. No medical, contact, GPS, or exact-address data.

export const DEMO_LEADERBOARD_UPDATED_AT = "2026-09-20";

export const DEMO_SCOPES = ["city", "state", "country", "global"];

export const DEMO_CATEGORIES = [
  "overall",
  "yoga",
  "fitness",
  "nutrition",
  "sustainability",
];

// Points are illustrative only. Scopes are coarse labels volunteered in the
// fiction (City: Delhi; State: Delhi; Country: India; Global: —).
export const DEMO_LEADERBOARD_ROWS = [
  { rank: 1, displayName: "Aarav S.", scope: "city", scopeLabel: "Delhi", overall: 1240, yoga: 420, fitness: 760, nutrition: 300, sustainability: 180, activeDays: 58 },
  { rank: 2, displayName: "Meera K.", scope: "city", scopeLabel: "Delhi", overall: 1180, yoga: 500, fitness: 700, nutrition: 260, sustainability: 220, activeDays: 55 },
  { rank: 3, displayName: "Rohan M.", scope: "city", scopeLabel: "Delhi", overall: 1090, yoga: 310, fitness: 640, nutrition: 280, sustainability: 170, activeDays: 52 },
  { rank: 4, displayName: "Ananya I.", scope: "state", scopeLabel: "Delhi", overall: 1320, yoga: 460, fitness: 800, nutrition: 320, sustainability: 200, activeDays: 60 },
  { rank: 5, displayName: "Vikram T.", scope: "state", scopeLabel: "Delhi", overall: 990, yoga: 280, fitness: 590, nutrition: 240, sustainability: 160, activeDays: 47 },
  { rank: 6, displayName: "Priya N.", scope: "country", scopeLabel: "India", overall: 1450, yoga: 520, fitness: 880, nutrition: 340, sustainability: 230, activeDays: 63 },
  { rank: 7, displayName: "Kabir K.", scope: "country", scopeLabel: "India", overall: 1210, yoga: 390, fitness: 720, nutrition: 290, sustainability: 200, activeDays: 56 },
  { rank: 8, displayName: "Sara D.", scope: "global", scopeLabel: "Global", overall: 1520, yoga: 560, fitness: 920, nutrition: 360, sustainability: 240, activeDays: 66 },
  { rank: 9, displayName: "Dev P.", scope: "global", scopeLabel: "Global", overall: 1380, yoga: 470, fitness: 840, nutrition: 330, sustainability: 210, activeDays: 61 },
  { rank: 10, displayName: "Ishita R.", scope: "global", scopeLabel: "Global", overall: 1150, yoga: 350, fitness: 690, nutrition: 270, sustainability: 190, activeDays: 54 },
];

export function demoRowsFor(scope, category) {
  const rows = DEMO_LEADERBOARD_ROWS.filter((r) => r.scope === scope).map((r) => ({
    rank: r.rank,
    displayName: r.displayName,
    scopeLabel: r.scopeLabel,
    points: r[category] ?? r.overall,
    activeDays: r.activeDays,
  }));
  rows.sort((a, b) => b.points - a.points);
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
