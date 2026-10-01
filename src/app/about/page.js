import WithNavbar from "../../components/layout/WithNavbar";
import AboutPage from "../../components/gigw/AboutPage";

export const metadata = { title: "About" };

export default function Page() {
  return (
    <WithNavbar>
      <AboutPage />
    </WithNavbar>
  );
}
