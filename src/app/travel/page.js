import WithNavbar from "../../components/layout/WithNavbar";
import TravelPage from "../../components/travel/TravelPage";

export const metadata = { title: "Travel" };

export default function Page() {
  return (
    <WithNavbar>
      <TravelPage />
    </WithNavbar>
  );
}
