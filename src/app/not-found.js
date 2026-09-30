import WithNavbar from "../components/layout/WithNavbar";
import NotFoundContent from "../components/layout/NotFoundContent";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <WithNavbar>
      <NotFoundContent />
    </WithNavbar>
  );
}
