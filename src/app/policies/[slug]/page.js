import { notFound } from "next/navigation";
import WithNavbar from "../../../components/layout/WithNavbar";
import { PolicyPage } from "../../../components/gigw/PoliciesPage";
import { POLICY_SLUGS } from "../../../config/sitemap";
import en from "../../../locales/en/translation.json";

export const dynamicParams = false;

export function generateStaticParams() {
  return POLICY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = en.policies?.[slug];
  return p ? { title: p.title, description: p.summary } : {};
}

export default async function Page({ params }) {
  const { slug } = await params;
  if (!POLICY_SLUGS.includes(slug)) notFound();
  return (
    <WithNavbar>
      <PolicyPage slug={slug} />
    </WithNavbar>
  );
}
