import WithNavbar from "../../components/layout/WithNavbar";
import EventsPage from "../../components/events/EventsPage";

export const metadata = { title: "Event planner" };

export default function Page() {
  return (
    <WithNavbar>
      <EventsPage />
    </WithNavbar>
  );
}
