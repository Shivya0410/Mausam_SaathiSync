import WithNavbar from "../../components/layout/WithNavbar";
import FamilyPage from "../../components/family/FamilyPage";

export const metadata = { title: "Family" };

export default function Page() {
  return (
    <WithNavbar>
      <FamilyPage />
    </WithNavbar>
  );
}
