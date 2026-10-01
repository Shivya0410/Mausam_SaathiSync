import WithNavbar from "../../components/layout/WithNavbar";
import ContactPage from "../../components/gigw/ContactPage";

export const metadata = { title: "Contact us" };

export default function Page() {
  return (
    <WithNavbar>
      <ContactPage />
    </WithNavbar>
  );
}
