import WithNavbar from "../../components/layout/WithNavbar";
import SettingsPage from "../../components/settings/SettingsPage";

export const metadata = { title: "Settings" };

export default function Page() {
  return (
    <WithNavbar>
      <SettingsPage />
    </WithNavbar>
  );
}
