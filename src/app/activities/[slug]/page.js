import { notFound } from "next/navigation";
import WithNavbar from "../../../components/layout/WithNavbar";
import ActivityListing from "../../../components/activities/ActivityListing";
import { ACTIVITIES, getActivity } from "../../../data/activities";

export const dynamicParams = false;

export function generateStaticParams() {
  return ACTIVITIES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const activity = getActivity(slug);
  return { title: activity ? `${activity.title} near you | Swasth Infinity` : "Activity | Swasth Infinity" };
}

export default async function ActivityPage({ params }) {
  const { slug } = await params;
  const activity = getActivity(slug);
  if (!activity) notFound();

  return (
    <WithNavbar>
      <ActivityListing activity={activity} />
    </WithNavbar>
  );
}
