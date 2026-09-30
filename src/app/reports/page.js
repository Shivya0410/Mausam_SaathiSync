import WithNavbar from "../../components/layout/WithNavbar";
import ReportsPage from "../../components/reports/ReportsPage";

export const metadata = { title: "Community reports" };

export default function Page() {
  return (
    <WithNavbar>
      <ReportsPage />
    </WithNavbar>
  );
}
