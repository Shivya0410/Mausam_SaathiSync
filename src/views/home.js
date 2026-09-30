"use client";

import WithNavbar from "../components/layout/WithNavbar";
import PlaceholderPage from "../components/layout/PlaceholderPage";

// The personalised homepage (PRD section 5) is built in Part 2. Until then
// the route renders inside the new shell with an honest placeholder.
export default function Home() {
  return (
    <WithNavbar>
      <PlaceholderPage pageKey="home" />
    </WithNavbar>
  );
}
