import WithNavbar from "../../components/layout/WithNavbar";
import LearnIndex from "../../components/learn/LearnIndex";

export const metadata = { title: "Learn" };

export default function Page() {
  return (
    <WithNavbar>
      <LearnIndex />
    </WithNavbar>
  );
}
