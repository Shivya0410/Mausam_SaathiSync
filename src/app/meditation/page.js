import WithNavbar from "../../components/layout/WithNavbar";
import ActivityListing from "../../components/activities/ActivityListing";
import { getActivity } from "../../data/activities";

// Kept so existing links to /meditation still work. The page itself is the
// shared activity listing, also served at /activities/meditation.
export default function MeditationPage() {
  return (
    <WithNavbar>
      <ActivityListing activity={getActivity("meditation")} />
    </WithNavbar>
  );
}
