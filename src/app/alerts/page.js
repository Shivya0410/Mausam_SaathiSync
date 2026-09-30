import WithNavbar from "../../components/layout/WithNavbar";
import AlertsPage from "../../components/alerts/AlertsPage";

export const metadata = { title: "Alerts" };

export default function Page() {
  return (
    <WithNavbar>
      <AlertsPage />
    </WithNavbar>
  );
}
