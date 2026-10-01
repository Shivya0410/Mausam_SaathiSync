import WithNavbar from "../../components/layout/WithNavbar";
import SitemapPage from "../../components/gigw/SitemapPage";

export const metadata = { title: "Sitemap" };

export default function Page() {
  return (
    <WithNavbar>
      <SitemapPage />
    </WithNavbar>
  );
}
