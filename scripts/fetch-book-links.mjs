// Resolve each book to its actual Open Library work page (not a search results
// page) via the Open Library search API. Writes content/book-openlibrary.json
// keyed by the likes.json title, kept SEPARATE from likes.json so it never
// collides with the pin tools.
//
//   npm run fetch:book-links

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const LIKES = join(dir, "..", "content", "likes.json");
const OUT = join(dir, "..", "content", "book-openlibrary.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Manual overrides where OL's search ranks a sibling/translation over the work
// (Chinese-titled canonical works, French original of The Anomaly).
const OVERRIDES = {
  "The Three-Body Problem": "https://openlibrary.org/works/OL17267881W",
  "The Anomaly": "https://openlibrary.org/works/OL24210931W",
};

const norm = (s) =>
  (s || "").toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

async function resolve(title, author) {
  const u =
    "https://openlibrary.org/search.json?limit=8&fields=key,title,author_name,first_publish_year,edition_count" +
    `&title=${encodeURIComponent(title)}` +
    (author ? `&author=${encodeURIComponent(author)}` : "");
  const r = await fetch(u, { headers: { "User-Agent": "personal-site-template (content fetcher)" } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const j = await r.json();
  const docs = j.docs || [];
  if (!docs.length) return null;

  // Score by exact/close title match + author match + popularity (edition_count),
  // so we don't grab a series sibling or a graded-reader adaptation.
  const wantT = norm(title);
  const wantA = norm(author);
  const score = (doc) => {
    const t = norm(doc.title);
    const authors = (doc.author_name || []).map(norm);
    let s = 0;
    if (t === wantT) s += 100;
    else if (t.startsWith(wantT) || wantT.startsWith(t)) s += 40;
    else if (t.includes(wantT)) s += 15;
    if (wantA && authors.some((a) => a.includes(wantA) || wantA.includes(a))) s += 30;
    s += Math.min(10, Math.log10((doc.edition_count || 1) + 1) * 3); // popularity tiebreak
    return s;
  };
  const best = docs.map((d) => [score(d), d]).sort((a, b) => b[0] - a[0])[0];
  const doc = best[1];
  return {
    url: "https://openlibrary.org" + doc.key,
    olTitle: doc.title,
    olAuthor: (doc.author_name || [])[0] || "",
    year: doc.first_publish_year || "",
    exact: norm(doc.title) === wantT,
  };
}

const d = JSON.parse(readFileSync(LIKES, "utf8"));
const out = {};
const rows = [];
for (const b of d.books || []) {
  if (OVERRIDES[b.title]) {
    out[b.title] = { url: OVERRIDES[b.title] };
    rows.push([b.title, b.author, "override  →  " + OVERRIDES[b.title]]);
    continue;
  }
  try {
    const res = await resolve(b.title, b.author);
    if (res) {
      out[b.title] = { url: res.url };
      const match = res.exact ? "ok" : "⚠️ CHECK";
      rows.push([b.title, b.author, `${match}  →  ${res.olTitle} / ${res.olAuthor} (${res.year})`]);
    } else {
      rows.push([b.title, b.author, "❌ NO RESULT"]);
    }
  } catch (e) {
    rows.push([b.title, b.author, "ERROR: " + String(e).slice(0, 40)]);
  }
  await sleep(250);
}

writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`book-openlibrary: ${Object.keys(out).length}/${(d.books || []).length} resolved\n`);
for (const [t, a, res] of rows) console.log(`• ${t} — ${a}\n    ${res}`);
