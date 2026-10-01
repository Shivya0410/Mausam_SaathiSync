import WithNavbar from "../../components/layout/WithNavbar";
import FeedbackPage from "../../components/gigw/FeedbackPage";

export const metadata = { title: "Feedback" };

export default function Page() {
  return (
    <WithNavbar>
      <FeedbackPage />
    </WithNavbar>
  );
}
