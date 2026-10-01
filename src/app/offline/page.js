import WithNavbar from "../../components/layout/WithNavbar";
import OfflinePage from "../../components/gigw/OfflinePage";

export const metadata = { title: "Offline" };

export default function Page() {
  return (
    <WithNavbar>
      <OfflinePage />
    </WithNavbar>
  );
}
