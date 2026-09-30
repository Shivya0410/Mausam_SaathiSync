import WithNavbar from "../../components/layout/WithNavbar";
import RunPage from "../../components/run/RunPage";

export const metadata = { title: "Run and play" };

export default function Page() {
  return (
    <WithNavbar>
      <RunPage />
    </WithNavbar>
  );
}
