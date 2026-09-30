import WithNavbar from "../../components/layout/WithNavbar";
import MapPage from "../../components/map/MapPage";

export const metadata = { title: "Map" };

export default function Page() {
  return (
    <WithNavbar>
      <MapPage />
    </WithNavbar>
  );
}
