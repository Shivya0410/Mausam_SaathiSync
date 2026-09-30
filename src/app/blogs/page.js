import WithNavbar from "../../components/layout/WithNavbar";
import CommunityFeed from "../../components/community/CommunityFeed";

export const metadata = { title: "Community stories | Swasth Infinity" };

export default function BlogsPage() {
  return (
    <WithNavbar>
      <CommunityFeed />
    </WithNavbar>
  );
}
