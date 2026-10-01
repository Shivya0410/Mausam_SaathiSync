import WithNavbar from "../../components/layout/WithNavbar";
import ScreenReaderPage from "../../components/gigw/ScreenReaderPage";

export const metadata = { title: "Screen reader access" };

export default function Page() {
  return (
    <WithNavbar>
      <ScreenReaderPage />
    </WithNavbar>
  );
}
