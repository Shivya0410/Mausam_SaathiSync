import { notFound } from "next/navigation";
import WithNavbar from "../../../components/layout/WithNavbar";
import ArticlePage from "../../../components/learn/ArticlePage";
import { ARTICLES, ARTICLE_BY_SLUG } from "../../../data/learn";
import en from "../../../locales/en/translation.json";

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const a = en.learn?.articles?.[slug];
  return a ? { title: a.title, description: a.summary } : {};
}

export default async function Page({ params }) {
  const { slug } = await params;
  if (!ARTICLE_BY_SLUG[slug]) notFound();
  return (
    <WithNavbar>
      <ArticlePage slug={slug} />
    </WithNavbar>
  );
}
