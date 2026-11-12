// Single launch switch for the public site.
//
// false  → every page route serves the "under construction" placeholder
//          (see middleware.ts).
// true   → the real Next.js site goes live.
//
// This is the one-line flip to launch: set to true, then `npm run deploy`.
export const SITE_LIVE = false;

// Displayed in the footer. Semantic versioning — MAJOR.MINOR.PATCH — used here
// as a friendly changelog counter (not an API contract). Bump the number that
// matches the biggest change in a deploy:
//
//   MAJOR  (X.0.0)  a redesign / overhaul. Rare.
//   MINOR  (1.X.0)  a new feature, page, or section, or a noticeable design
//                   change. Occasional.
//   PATCH  (1.1.X)  added or fixed content — the everyday bump. Frequent.
//
// Rule: when you bump a number, reset everything to its right to 0.
export const SITE_VERSION = "0.1.0";
