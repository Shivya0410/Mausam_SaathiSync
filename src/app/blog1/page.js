import { redirect } from "next/navigation";

// Jane's post moved into the community feed.
export default function Blog1() {
  redirect("/blogs/jane-30-day-running-streak");
}
