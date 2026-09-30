import WithNavbar from "../../components/layout/WithNavbar";
import WorkPage from "../../components/work/WorkPage";

export const metadata = { title: "Outdoor work" };

export default function Page() {
  return (
    <WithNavbar>
      <WorkPage />
    </WithNavbar>
  );
}
