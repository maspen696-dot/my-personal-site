import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

// Lists the main pages + every blog post so search engines don't rely purely on
// internal links. Adventures are external (link-out tiles), so only the index is
// listed. Regenerated at build.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://example.com";
  const pages = [
    "",
    "/projects",
    "/blog",
    "/adventures",
    "/things-i-like",
    "/contact",
    "/colophon",
  ].map((path) => ({ url: base + path }));

  const posts = getAllPosts().map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: p.date ? new Date(p.date) : undefined,
  }));

  return [...pages, ...posts];
}
