import WithNavbar from "../../components/layout/WithNavbar";
import HealthPage from "../../components/health/HealthPage";

export const metadata = { title: "Health" };

export default function Page() {
  return (
    <WithNavbar>
      <HealthPage />
    </WithNavbar>
  );
}
