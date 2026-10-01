import WithNavbar from "../../components/layout/WithNavbar";
import { PoliciesHub } from "../../components/gigw/PoliciesPage";

export const metadata = { title: "Website policies" };

export default function Page() {
  return (
    <WithNavbar>
      <PoliciesHub />
    </WithNavbar>
  );
}
