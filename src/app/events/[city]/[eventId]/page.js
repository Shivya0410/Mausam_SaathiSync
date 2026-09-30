import { notFound } from "next/navigation";
import WithNavbar from "../../../../components/layout/WithNavbar";
import EventDetail from "../../../../components/events/EventDetail";
import { EVENTS, getEvent } from "../../../../data/fitnessEvents";

export const dynamicParams = false;

export function generateStaticParams() {
  return EVENTS.map((e) => ({ city: e.city, eventId: e.id }));
}

export async function generateMetadata({ params }) {
  const { eventId } = await params;
  const event = getEvent(eventId);
  return {
    title: event ? `${event.title} | Swasth Infinity` : "Event | Swasth Infinity",
    description: event?.description,
  };
}

export default async function EventPage({ params }) {
  const { city, eventId } = await params;
  const event = getEvent(eventId);
  // The city segment must match the event, so /events/mumbai/hyrox-delhi-2026 is a 404.
  if (!event || event.city !== city) notFound();

  return (
    <WithNavbar>
      <EventDetail event={event} />
    </WithNavbar>
  );
}
