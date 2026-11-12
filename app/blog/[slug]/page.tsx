import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPost, formatDate } from "@/lib/blog";
import ReadingProgress from "@/components/ReadingProgress";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { BLOG_SUBSCRIBE } from "@/lib/newsletters";

// Enumerate every post for build-time generation / SEO. dynamicParams stays at
// its default (true): OpenNext on Workers serves these through the worker with
// no incremental cache, so the page renders on demand from the bundled
// posts.json — getPost() + a redirect to / handles unknown slugs.
export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.subtitle || undefined,
    alternates: { canonical: post.canonical },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) redirect("/"); // unknown slug -> home (consistent with app/not-found)

  // The "originally published" link sits at the TOP of every post.
  const outbound = (
    <div className="nj-post-outbound">
      This piece was originally published on My Newsletter.{" "}
      <a href={post.canonical} target="_blank" rel="noopener noreferrer">
        Read &amp; discuss on Substack →
      </a>
    </div>
  );

  return (
    <article>
      <ReadingProgress />
      <Link href="/blog" className="nj-back">
        ← Blog
      </Link>
      <h1 className="nj-post-title">{post.title}</h1>
      <div className="nj-post-meta">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        {post.subtitle && <span>{post.subtitle}</span>}
      </div>

      {outbound}

      <div
        className="nj-post-content"
        dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
      />

      {/* Highest-intent slot: they just finished reading. */}
      <NewsletterSubscribe {...BLOG_SUBSCRIBE} />
    </article>
  );
}
