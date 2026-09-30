import WithNavbar from "../../components/layout/WithNavbar";
import ReportPage from "../../components/cv/ReportPage";

export const metadata = { title: "Report" };

export default function Page() {
  return (
    <WithNavbar>
      <ReportPage />
    </WithNavbar>
  );
}
