// Resolve each movie to its English Wikipedia article. Uses curated article
// titles (handles disambiguation) verified against the Wikipedia REST summary
// API, which resolves redirects and flags disambiguation pages. Writes
// content/movie-wiki.json keyed by the likes.json title, kept SEPARATE from
// likes.json so it never collides with the pin tools.
//
//   npm run fetch:movie-wiki

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const LIKES = join(dir, "..", "content", "likes.json");
const OUT = join(dir, "..", "content", "movie-wiki.json");

// Curated Wikipedia article titles (keyed by the movie title in likes.json).
const CANDIDATES = {
  "La La Land": "La La Land",
  Burnt: "Burnt (film)",
  "Kung Fu Panda": "Kung Fu Panda (film)",
  "Kung Fu Panda 3": "Kung Fu Panda 3",
  "Bad Guys": "The Bad Guys (film)",
  "The Wolf of Wall Street": "The Wolf of Wall Street (2013 film)",
  "Baby Driver": "Baby Driver",
  Borat: "Borat",
  Ted: "Ted (film)",
  "21 Jump Street": "21 Jump Street (film)",
  "White Chicks": "White Chicks",
  "Crazy, Stupid, Love": "Crazy, Stupid, Love",
  "Edge of Tomorrow": "Edge of Tomorrow",
  Ratatouille: "Ratatouille (film)",
  Rango: "Rango (2011 film)",
  Soul: "Soul (2020 film)",
  "Reminders of Him": "Reminders of Him",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function summary(articleTitle) {
  const url =
    "https://en.wikipedia.org/api/rest_v1/page/summary/" +
    encodeURIComponent(articleTitle.replace(/ /g, "_")) +
    "?redirect=true";
  const r = await fetch(url, { headers: { "User-Agent": "personal-site-template (content fetcher)" } });
  if (r.status === 404) return { missing: true };
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

const d = JSON.parse(readFileSync(LIKES, "utf8"));
const out = {};
const rows = [];
for (const m of d.movies || []) {
  const cand = CANDIDATES[m.title] || m.title;
  try {
    const s = await summary(cand);
    if (s.missing) {
      rows.push([m.title, "❌ NO ARTICLE (" + cand + ")", ""]);
    } else {
      const flag = s.type === "disambiguation" ? "⚠️ DISAMBIG" : "ok";
      out[m.title] = { wikiTitle: s.title, url: s.content_urls.desktop.page };
      rows.push([m.title, `${flag}  →  ${s.title}`, (s.extract || "").slice(0, 90)]);
    }
  } catch (e) {
    rows.push([m.title, "ERROR: " + String(e).slice(0, 40), ""]);
  }
  await sleep(350); // stay under Wikipedia's rate limit
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`movie-wiki: ${Object.keys(out).length}/${(d.movies || []).length} resolved -> content/movie-wiki.json\n`);
for (const [t, res, ex] of rows) {
  console.log(`• ${t}\n    ${res}\n    ${ex ? '"' + ex + '…"' : ""}`);
}
