import WithNavbar from "../../components/layout/WithNavbar";
import HouseholdPage from "../../components/household/HouseholdPage";

export const metadata = { title: "Household" };

export default function Page() {
  return (
    <WithNavbar>
      <HouseholdPage />
    </WithNavbar>
  );
}
