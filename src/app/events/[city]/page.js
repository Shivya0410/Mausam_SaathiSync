import { notFound } from "next/navigation";
import WithNavbar from "../../../components/layout/WithNavbar";
import EventsExplorer from "../../../components/events/EventsExplorer";
import { CITIES, getCity } from "../../../data/fitnessEvents";

export const dynamicParams = false;

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }) {
  const { city } = await params;
  const found = getCity(city);
  return { title: found ? `Fitness events in ${found.name} | Swasth Infinity` : "Events | Swasth Infinity" };
}

export default async function CityEventsPage({ params }) {
  const { city } = await params;
  if (!getCity(city)) notFound();

  return (
    <WithNavbar>
      <EventsExplorer citySlug={city} />
    </WithNavbar>
  );
}
