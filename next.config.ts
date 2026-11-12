import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Dev-only: lets other devices on the LAN (e.g. your phone) load the dev
  // server's JS so client components hydrate. Set this to your machine's LAN IP
  // when testing on a phone (e.g. ["192.168.1.42"]). Ignored in production.
  allowedDevOrigins: [],
  async redirects() {
    return [
      // A couple of convenience aliases → the canonical page. Add your own.
      { source: "/likes", destination: "/things-i-like", permanent: true },
      { source: "/recommends", destination: "/things-i-like", permanent: true },
    ];
  },
};

export default nextConfig;

// Makes Cloudflare bindings (e.g. the DB D1 binding) available to
// `next dev` via getCloudflareContext(). No-op in production builds.
initOpenNextCloudflareForDev();
