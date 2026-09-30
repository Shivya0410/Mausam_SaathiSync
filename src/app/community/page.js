import WithNavbar from "../../components/layout/WithNavbar";
import CommunityHub from "../../components/community/CommunityHub";

export const metadata = { title: "Community hub | Swasth Infinity" };

export default function CommunityPage() {
  return (
    <WithNavbar>
      <CommunityHub />
    </WithNavbar>
  );
}
