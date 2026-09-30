"use client";

import WithNavbar from "../../components/layout/WithNavbar";
import PageHeader from "../../components/layout/PageHeader";
import LeaderboardView from "../../components/leaderboard/LeaderboardView";

export default function LeaderboardPage() {
  return (
    <WithNavbar>
      <main style={{ padding: "24px", maxWidth: 960 }}>
        <PageHeader
          title="Leaderboard"
          subtitle="City / State / Country / Global by Overall, Yoga, Fitness, Nutrition, Sustainability. Public standings only."
        />
        <LeaderboardView />
      </main>
    </WithNavbar>
  );
}
