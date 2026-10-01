import WithNavbar from "../../components/layout/WithNavbar";
import AccessibilityPage from "../../components/gigw/AccessibilityPage";

export const metadata = { title: "Accessibility statement" };

export default function Page() {
  return (
    <WithNavbar>
      <AccessibilityPage />
    </WithNavbar>
  );
}
