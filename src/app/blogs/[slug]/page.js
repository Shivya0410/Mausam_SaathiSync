import { notFound } from "next/navigation";
import WithNavbar from "../../../components/layout/WithNavbar";
import CommunityPost from "../../../components/community/CommunityPost";
import { AUTHORS, POSTS, getPost } from "../../../data/communityFeed";

export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Story | Swasth Infinity" };
  return { title: `${post.title} | ${AUTHORS[post.author].name}`, description: post.subtitle };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <WithNavbar>
      <CommunityPost post={post} />
    </WithNavbar>
  );
}
