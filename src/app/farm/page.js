import WithNavbar from "../../components/layout/WithNavbar";
import FarmPage from "../../components/farm/FarmPage";

export const metadata = { title: "Farm and garden" };

export default function Page() {
  return (
    <WithNavbar>
      <FarmPage />
    </WithNavbar>
  );
}
