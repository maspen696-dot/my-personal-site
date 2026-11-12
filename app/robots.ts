import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Gated recruiting page + API/redirect internals shouldn't be indexed.
      disallow: ["/api/"],
    },
    sitemap: "https://example.com/sitemap.xml",
  };
}
