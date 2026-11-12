import Link from "next/link";
import { getAllPosts, formatShortDate } from "@/lib/blog";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { BLOG_SUBSCRIBE } from "@/lib/newsletters";

export default function BlogIndex() {
  const posts = getAllPosts(); // newest first (manifest is pre-sorted)

  // Year shown only on the first row of each year (njbrown layout).
  let lastYear = "";

  return (
    <>
      <h1 className="nj-page-title">Blog</h1>
      <p className="nj-page-intro">
        My essays on recruiting, college, careers, curiosity, and much, much
        more. Originally published on{" "}
        <a href="https://yourname.substack.com" target="_blank" rel="noopener noreferrer">
          My Newsletter
        </a>
        .
      </p>

      <NewsletterSubscribe {...BLOG_SUBSCRIBE} atTop />

      <table className="nj-posts-table">
        <tbody>
          {posts.map((post) => {
            const year = post.date.slice(0, 4);
            const showYear = year !== lastYear;
            lastYear = year;
            return (
              <tr key={post.slug}>
                <td className="nj-col-year">{showYear ? year : ""}</td>
                <td className="nj-col-title">
                  <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                </td>
                <td className="nj-col-date">{formatShortDate(post.date)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
