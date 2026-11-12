import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MinimalChrome from "@/components/MinimalChrome";
import { siteConfig } from "@/site.config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.tagline,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.tagline,
    url: siteConfig.url,
    siteName: siteConfig.name,
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.tagline,
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // suppressHydrationWarning on <html>: some browser extensions inject attrs
  // (e.g. __gcrremoteframetoken) before React hydrates, which would otherwise
  // log a false-positive mismatch. Only affects attrs on this one element.
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <MinimalChrome>{children}</MinimalChrome>
      </body>
    </html>
  );
}
