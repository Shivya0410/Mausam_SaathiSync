import WithNavbar from "../../components/layout/WithNavbar";
import CoastPage from "../../components/coast/CoastPage";

export const metadata = { title: "Beach and sea" };

export default function Page() {
  return (
    <WithNavbar>
      <CoastPage />
    </WithNavbar>
  );
}
