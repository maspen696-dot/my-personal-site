// Imports both Substack archives into content/ as static, bundled data.
// Re-runnable: pulls every post fresh. Run after publishing a new post.
//
//   npm run import:content
//
// Substack's RSS only carries ~20 latest posts, so we page the archive API
// (all posts) instead. Output is consumed via bundled ES imports — no runtime
// fs, so it works on the Cloudflare Workers runtime where the pages render.
//
//   content/blog/manifest.json        — blog, ordered [{ slug, title, subtitle, date, canonical, cover }]
//   content/blog/posts.json           — blog, { [slug]: { ...meta, bodyHtml } } (read on-site at /blog)
//   content/adventures/manifest.json  — adventures, ordered [{ title, date, link, cover }] (link-out tiles)

import { mkdir, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const UA = "Mozilla/5.0 (personal-site import script)";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Your two Substack publications. Set these to YOUR archives (or via env).
// Keep in sync with site.config.ts → newsletters.*.domain. If you only run one
// newsletter, leave ADVENTURES_ORIGIN as-is and ignore the /adventures import.
const BLOG_ORIGIN =
  process.env.BLOG_SUBSTACK_URL ?? "https://yourname.substack.com";
const ADVENTURES_ORIGIN =
  process.env.ADVENTURES_SUBSTACK_URL ?? "https://youradventures.substack.com";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Polite fetch with backoff: Substack rate-limits (429) bursts of requests.
async function getJSON(url, attempt = 0) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 429 && attempt < 6) {
    const wait = 2000 * 2 ** attempt; // 2s, 4s, 8s, …
    console.log(`  · 429, backing off ${wait / 1000}s…`);
    await sleep(wait);
    return getJSON(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  await sleep(350); // throttle between calls
  return res.json();
}

// Strip Substack's subscription / share / paywall CTA chrome; keep the essay.
function cleanBody(html) {
  return html
    .replace(/<div class="subscription-widget[^]*?<\/div>\s*<\/div>/g, "")
    .replace(/<div class="subscribe-widget[^]*?<\/div>\s*<\/div>/g, "")
    .replace(/<p class="button-wrapper"[^]*?<\/p>/g, "")
    .replace(/<div class="captioned-button-wrapper"[^]*?<\/div>/g, "")
    .replace(/<div class="paywall[^]*?<\/div>/g, "")
    // The subscription-widget regex can stop at an inner </div></div>, leaving
    // the subscribe form's orphaned closing tags plus Substack's divider
    // stranded at the very top of the body. Strip any leading run of orphan
    // closing tags, then a single leading <hr> divider.
    .replace(/^\s*(?:<\/(?:form|div|p|h\d)>\s*)+/i, "")
    .replace(/^\s*<div>\s*<hr\s*\/?>\s*<\/div>\s*/i, "")
    .trim();
}

async function listAllPosts(origin) {
  const all = [];
  for (let offset = 0; ; offset += 12) {
    const page = await getJSON(
      `${origin}/api/v1/archive?sort=new&search=&offset=${offset}&limit=12`,
    );
    if (!Array.isArray(page) || page.length === 0) break;
    all.push(...page);
    if (page.length < 12) break;
  }
  return all;
}

// Blog → full post bodies, read on-site at /blog/<slug>.
async function importBlog() {
  const ORIGIN = BLOG_ORIGIN;
  const OUT = join(ROOT, "content", "blog");
  console.log("\n[blog] Fetching blog archive…");
  const listing = await listAllPosts(ORIGIN);
  console.log(`[blog] ${listing.length} posts. Fetching bodies…`);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const manifest = [];
  const posts = {};
  for (const item of listing) {
    const slug = item.slug;
    let full;
    try {
      full = await getJSON(`${ORIGIN}/api/v1/posts/${slug}`);
    } catch (err) {
      console.warn(`  ! skip ${slug}: ${err.message}`);
      continue;
    }
    const meta = {
      slug,
      title: full.title ?? item.title ?? "",
      subtitle: full.subtitle ?? item.subtitle ?? "",
      date: (full.post_date ?? item.post_date ?? "").slice(0, 10),
      canonical: full.canonical_url ?? `${ORIGIN}/p/${slug}`,
      cover: full.cover_image ?? item.cover_image ?? null,
    };
    const bodyHtml = cleanBody(full.body_html ?? "");
    if (bodyHtml.length < 80) continue; // skip empty/placeholder posts
    posts[slug] = { ...meta, bodyHtml };
    manifest.push(meta);
  }

  manifest.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  await writeFile(join(OUT, "posts.json"), JSON.stringify(posts));
  console.log(`[blog] Wrote ${manifest.length} posts to content/blog/`);
}

// Adventures → metadata only (these are link-out picture tiles).
async function importAdventures() {
  const ORIGIN = ADVENTURES_ORIGIN;
  const OUT = join(ROOT, "content", "adventures");
  console.log("\n[adventures] Fetching Adventures archive…");
  const listing = await listAllPosts(ORIGIN);

  const manifest = listing
    .map((item) => ({
      title: item.title ?? "",
      date: (item.post_date ?? "").slice(0, 10),
      link: item.canonical_url ?? `${ORIGIN}/p/${item.slug}`,
      cover: item.cover_image ?? null,
    }))
    .filter((p) => p.title && p.date && p.cover) // tiles need a cover; drops empty placeholders
    .sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`[adventures] Wrote ${manifest.length} tiles to content/adventures/`);
}

async function main() {
  await importBlog();
  await importAdventures();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
