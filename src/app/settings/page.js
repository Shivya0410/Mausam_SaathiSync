import WithNavbar from "../../components/layout/WithNavbar";
import PlaceholderPage from "../../components/layout/PlaceholderPage";

export const metadata = { title: "Settings" };

// Planned route (PRD section 4.1); content arrives in build plan Part 2 or 3.
export default function Page() {
  return (
    <WithNavbar>
      <PlaceholderPage pageKey="settings" />
    </WithNavbar>
  );
}
