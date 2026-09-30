import { redirect } from "next/navigation";

// Mike's post moved into the community feed.
export default function Blog2() {
  redirect("/blogs/mike-30-mile-cycling-record");
}
