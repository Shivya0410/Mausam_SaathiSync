import WithNavbar from "../../components/layout/WithNavbar";
import ReadyPage from "../../components/ready/ReadyPage";

export const metadata = { title: "Be ready" };

export default function Page() {
  return (
    <WithNavbar>
      <ReadyPage />
    </WithNavbar>
  );
}
