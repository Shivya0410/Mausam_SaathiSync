import { allPaths } from "../config/sitemap";
import { SITE } from "../config/site";

/** Machine-readable sitemap (PRD 4.3). */
export default function sitemap() {
  const lastModified = new Date(`${SITE.lastUpdated}T00:00:00+05:30`);
  return allPaths().map((path) => ({ url: `${SITE.url}${path}`, lastModified }));
}
