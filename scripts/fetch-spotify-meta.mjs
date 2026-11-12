// Fetch Spotify cover art + titles for the "other" category and write them to
// content/spotify-meta.json (keyed by URL). Kept SEPARATE from likes.json so it
// never collides with the pin tools writing favorites.
//
//   npm run fetch:spotify
//
// The "Other" section renders any Spotify album/episode as a cover-art tile
// (image links to Spotify, your note underneath); non-Spotify entries stay text.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const LIKES = join(dir, "..", "content", "likes.json");
const OUT = join(dir, "..", "content", "spotify-meta.json");

const isSpotify = (u) => /open\.spotify\.com\/(album|episode|track|playlist|show)\//.test(u || "");

// Decode the handful of HTML entities Spotify emits (e.g. &amp; in "beerbongs &amp; bentleys").
const decode = (s) =>
  (s || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

const d = JSON.parse(readFileSync(LIKES, "utf8"));
const urls = (d.other || []).map((x) => x.url).filter(isSpotify);

const meta = {};
let ok = 0;
const errors = [];
await Promise.all(
  urls.map(async (url) => {
    try {
      const r = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      if (!j.thumbnail_url) throw new Error("no thumbnail");
      // oEmbed gives the clean title + cover, but not the artist. Grab the
      // artist (albums) / show (podcasts) from the page's og:description, whose
      // first "·"-segment is the creator (e.g. "Post Malone · album · 2018…").
      let artist = null;
      try {
        const page = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
        const html = await page.text();
        const m = html.match(/<meta property="og:description" content="([^"]+)"/);
        if (m) artist = decode(m[1].split(" · ")[0].trim()) || null;
      } catch {}
      meta[url] = { title: decode(j.title) || null, artist, thumb: j.thumbnail_url };
      ok++;
    } catch (e) {
      errors.push([url, String(e)]);
    }
  }),
);

writeFileSync(OUT, JSON.stringify(meta, null, 2) + "\n");
console.log(`spotify-meta: ${ok}/${urls.length} covers fetched -> content/spotify-meta.json`);
for (const [u, e] of errors) console.log(`  FAIL ${e} — ${u}`);
