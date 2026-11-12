import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SITE_LIVE } from "@/lib/site";
import { siteConfig } from "@/site.config";

// Pre-launch placeholder. Served inline by middleware (rather than rewriting to
// a /public file — under OpenNext on Workers, static assets are served by a
// separate ASSETS layer in front of the Worker, so a middleware rewrite to a
// public file 404s). Returning the body directly works in all runtimes.
//
// NOTE: this stays `middleware.ts` (Edge runtime) rather than the Next 16
// `proxy.ts` convention — OpenNext/Cloudflare only supports Edge middleware, and
// proxy.ts defaults to the Node.js runtime, which fails the build. The deprecation
// warning is cosmetic; do not rename until OpenNext supports Node.js proxy.
//
// The matcher excludes the functional paths so they pass through untouched:
//   /api/*             (API route handlers, e.g. the contact form)
//   /blog, /adventures (sections you may want live before the full launch)
//   /projects           (served by the app — otherwise bare /projects serves the
//                        placeholder whose CTA links back to /projects/ → a loop)
//   /_next/*, favicon   (assets the placeholder / app need)
//
// To launch the whole site: set SITE_LIVE = true in lib/site.ts and redeploy.
// /blog, /adventures, and /projects stay reachable regardless of that flag.
const PLACEHOLDER_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${siteConfig.name}</title>
  <meta name="description" content="${siteConfig.domain} — under construction." />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ctext y='52' font-size='52'%3E%F0%9F%8F%A0%3C/text%3E%3C/svg%3E" />
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0; min-height: 100%;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 22px; padding: 28px;
      background: #07090c; color: #e7ecf2;
      font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      text-align: center; -webkit-font-smoothing: antialiased;
    }
    h1 { font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; margin: 0; }
    img {
      max-width: min(600px, 92vw); width: 100%; height: auto;
      border: 1px solid #1b2230; border-radius: 14px; display: block;
    }
    p { margin: 0; color: #8a97a6; }
    a { color: #57e389; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${siteConfig.name}</h1>
  <p>Site under construction. In the meantime, check out <a href="/projects/">my projects</a>!</p>
</body>
</html>`;

export function middleware(req: NextRequest) {
  // Local `next dev` always shows the real site so we can build/review it. The
  // placeholder only guards real (production) deploys, where SITE_LIVE governs.
  if (SITE_LIVE || process.env.NODE_ENV !== "production") {
    return NextResponse.next();
  }
  return new NextResponse(PLACEHOLDER_HTML, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

export const config = {
  matcher: [
    "/((?!api/|_next/|favicon\\.ico|blog|adventures|projects).*)",
  ],
};
