import WithNavbar from "../../components/layout/WithNavbar";
import CommutePage from "../../components/commute/CommutePage";

export const metadata = { title: "Commute" };

export default function Page() {
  return (
    <WithNavbar>
      <CommutePage />
    </WithNavbar>
  );
}
