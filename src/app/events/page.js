import WithNavbar from "../../components/layout/WithNavbar";
import EventsExplorer from "../../components/events/EventsExplorer";

export const metadata = { title: "Fitness events across India | Swasth Infinity" };

export default function EventsPage() {
  return (
    <WithNavbar>
      <EventsExplorer />
    </WithNavbar>
  );
}
