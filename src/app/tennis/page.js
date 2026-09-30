import WithNavbar from "../../components/layout/WithNavbar";
import ActivityListing from "../../components/activities/ActivityListing";
import { getActivity } from "../../data/activities";

// Kept so existing links to /tennis still work. The page itself is the shared
// activity listing, also served at /activities/tennis.
export default function TennisPage() {
  return (
    <WithNavbar>
      <ActivityListing activity={getActivity("tennis")} />
    </WithNavbar>
  );
}
