import WithNavbar from "../../components/layout/WithNavbar";
import HelpPage from "../../components/gigw/HelpPage";

export const metadata = { title: "Help" };

export default function Page() {
  return (
    <WithNavbar>
      <HelpPage />
    </WithNavbar>
  );
}
