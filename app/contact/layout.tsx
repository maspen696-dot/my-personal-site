import type { Metadata } from "next";
import { siteConfig } from "@/site.config";

// /contact is a client component, so it can't export metadata itself — this
// server-component layout supplies the title/description for shares + SEO.
export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${siteConfig.name} — questions, collabs, or a meet-up in ${siteConfig.location}.`,
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
