// Presets for the context-matched newsletter subscribe boxes (see
// components/NewsletterSubscribe.tsx). Each page shows the newsletter that
// matches it, plus a one-line link to the *other* one — so a hiking reader
// isn't enrolled into business essays (or vice versa), which keeps Substack
// deliverability clean across a shared account.
//
// Pulls from site.config.ts. If you only run one newsletter, point both at it
// (or drop the /adventures section entirely).

import { siteConfig } from "@/site.config";

const { blog, adventures } = siteConfig.newsletters;

// Shown on /blog and blog posts.
export const BLOG_SUBSCRIBE = {
  publication: blog.name,
  domain: blog.domain,
  otherName: adventures.name,
  otherUrl: "/adventures", // internal — the on-site Adventures section
  otherPitch: "More of a trail person?",
} as const;

// Shown on /adventures.
export const ADVENTURES_SUBSCRIBE = {
  publication: adventures.name,
  domain: adventures.domain,
  otherName: blog.name,
  otherUrl: "/blog", // internal — the on-site Blog section
  otherPitch: "Here for the essays?",
} as const;
