import WithNavbar from "../../components/layout/WithNavbar";
import SkySnap from "../../components/cv/SkySnap";

export const metadata = { title: "Sky Snap" };

export default function Page() {
  return (
    <WithNavbar>
      <SkySnap />
    </WithNavbar>
  );
}
