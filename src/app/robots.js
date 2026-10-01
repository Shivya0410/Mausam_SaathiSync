import { SITE } from "../config/site";

export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/login", "/register", "/logout"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
