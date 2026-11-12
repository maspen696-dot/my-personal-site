import type { Metadata } from "next";
import Accordion from "@/components/Accordion";
import QuotesList from "@/components/QuotesList";
import likes from "@/content/likes.json";
import spotifyMeta from "@/content/spotify-meta.json";
import movieWiki from "@/content/movie-wiki.json";
import bookLinks from "@/content/book-openlibrary.json";
import { siteConfig } from "@/site.config";

export const metadata: Metadata = {
  title: "Things I like",
  description: `Books, movies, quotes, videos, articles, and other things ${siteConfig.name} recommends.`,
};

type Book = { title: string; author?: string; note?: string; favorite?: boolean; added?: string };
type Movie = { title: string; year?: string; note?: string; favorite?: boolean; added?: string };

// The site went live on 2026-07-04. Every entry carries an `added` date: the
// original launch set is dated the launch day (2026-07-04) and anything added
// since gets its own date, so all items print a small "added <Mon Year>" tag.
const LAUNCH_DATE = "2026-07-04";

// Favorites first, then non-favorites. Within EACH group, newest addition first
// (most-recent → least-recent by `added`). Ties — including the whole original
// launch set, all dated the launch day — keep their file order via the stable
// sort, so the JSON stays a simple append log. Any future item left without an
// `added` falls back to the launch date.
function orderItems<T extends { favorite?: boolean; added?: string }>(arr: T[]): T[] {
  const byNewest = (a: T, b: T) =>
    (b.added ?? LAUNCH_DATE).localeCompare(a.added ?? LAUNCH_DATE);
  const favs = arr.filter((x) => x.favorite).sort(byNewest);
  const rest = arr.filter((x) => !x.favorite).sort(byNewest);
  return [...favs, ...rest];
}

// "Jul 5, 2026" — the "added on" tag next to newer entries. Parsed in UTC so
// the date doesn't drift by timezone.
function formatAdded(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

type Linked = { title: string; author?: string; url: string; note?: string; favorite?: boolean; added?: string };
type Other = { note?: string; url?: string; favorite?: boolean; added?: string };

// Spotify albums/episodes render as cover-art tiles; everything else stays text.
const covers = spotifyMeta as Record<
  string,
  { title: string | null; artist?: string | null; thumb: string }
>;
const isSpotify = (u?: string) => !!u && u in covers;

// Movie titles link to their Wikipedia article (resolved in movie-wiki.json).
const wiki = movieWiki as Record<string, { wikiTitle: string; url: string }>;

// Book titles link to their Open Library work page (resolved in
// book-openlibrary.json); fall back to a search if one is somehow missing.
const bookUrl = bookLinks as Record<string, { url: string }>;
const openLibrary = (title: string, author?: string) =>
  bookUrl[title]?.url ??
  `https://openlibrary.org/search?q=${encodeURIComponent([title, author].filter(Boolean).join(" "))}`;

// Quotes live in their own content/quotes.json (large, append-only) and render
// via <QuotesList />. The rest of the categories come from likes.json.
const data = likes as {
  books: Book[];
  movies: Movie[];
  videos: Linked[];
  articles: Linked[];
  other: Other[];
};

export default function ThingsILike() {
  return (
    <>
      <h1 className="nj-page-title">Things I like</h1>
      <p className="nj-page-intro">
        A running list of some of my favorite things. Quickly growing and
        certainly not exhaustive.
        <br />
        These lists are intentionally organized in the order Books &rarr;
        Articles &rarr; Quotes &rarr; Movies &rarr; Videos (written pieces first,
        videos last, in decreasing length of medium), as I believe the written
        word is significantly more permanent and impactful long-term than videos.
        <br />
        I was going to add a music section, then realized I have 3500+ Liked
        Songs on Spotify so it&rsquo;d be hopeless. My favorite albums are in
        &ldquo;Other&rdquo;!
      </p>

      <p className="nj-like-legend">
        <span className="nj-like-star">★</span> indicates my absolute favorites,
        which come first. Every entry is tagged with the date I added it &mdash;
        the original set is dated July&nbsp;4,&nbsp;2026 (launch day) &mdash; and
        within both the favorites and the rest, newer additions come first.
      </p>

      <Accordion title="Books">
        <ul className="nj-like-list">
          {orderItems(data.books).map((b) => (
            <li key={b.title}>
              {b.favorite && <span className="nj-like-star">★</span>}
              <a
                href={openLibrary(b.title, b.author)}
                target="_blank"
                rel="noopener noreferrer"
                className="nj-like-main"
              >
                {b.title}
              </a>
              {b.author && <span className="nj-like-sub"> ({b.author})</span>}
              {b.added && <span className="nj-like-date"> · added {formatAdded(b.added)}</span>}
            </li>
          ))}
        </ul>
      </Accordion>

      <Accordion title="Articles">
        <ul className="nj-like-list">
          {orderItems(data.articles).map((a) => (
            <li key={a.url}>
              {a.favorite && <span className="nj-like-star">★</span>}
              <a href={a.url} target="_blank" rel="noopener noreferrer" className="nj-like-main">
                {a.title || a.url} ↗
              </a>
              {a.author && <span className="nj-like-byline">— {a.author}</span>}
              {a.added && <span className="nj-like-date"> · added {formatAdded(a.added)}</span>}
            </li>
          ))}
        </ul>
      </Accordion>

      <Accordion title="Quotes" openOnHashPrefix="#quote-">
        <QuotesList />
      </Accordion>

      <Accordion title="Movies">
        <ul className="nj-like-list">
          {orderItems(data.movies).map((m) => (
            <li key={m.title}>
              {m.favorite && <span className="nj-like-star">★</span>}
              {wiki[m.title]?.url ? (
                <a
                  href={wiki[m.title].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nj-like-main"
                >
                  {m.title}
                </a>
              ) : (
                <span className="nj-like-main">{m.title}</span>
              )}
              {m.year && <span className="nj-like-sub"> ({m.year})</span>}
              {m.added && <span className="nj-like-date"> · added {formatAdded(m.added)}</span>}
            </li>
          ))}
        </ul>
      </Accordion>

      <Accordion title="Videos">
        <ul className="nj-like-list">
          {orderItems(data.videos).map((v) => (
            <li key={v.url}>
              {v.favorite && <span className="nj-like-star">★</span>}
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="nj-like-main">
                {v.title || v.url} ↗
              </a>
              {v.added && <span className="nj-like-date"> · added {formatAdded(v.added)}</span>}
            </li>
          ))}
        </ul>
      </Accordion>

      <Accordion title="Other">
        {(() => {
          const ordered = orderItems(data.other);
          const albums = ordered.filter((o) => isSpotify(o.url));
          const rest = ordered.filter((o) => !isSpotify(o.url));
          return (
            <>
              {albums.length > 0 && (
                <ul className="nj-cover-grid">
                  {albums.map((o, i) => {
                    const c = covers[o.url!];
                    return (
                      <li key={o.url || i} className="nj-cover">
                        <a href={o.url} target="_blank" rel="noopener noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.thumb} alt={c.title || "cover"} loading="lazy" />
                        </a>
                        <p className="nj-cover-title">
                          {o.favorite && <span className="nj-like-star">★</span>}
                          {c.title}
                        </p>
                        {c.artist && <p className="nj-cover-artist">{c.artist}</p>}
                        {o.note && <p className="nj-cover-note">{o.note}</p>}
                        {o.added && <p className="nj-cover-note nj-like-date">added {formatAdded(o.added)}</p>}
                      </li>
                    );
                  })}
                </ul>
              )}
              {rest.length > 0 && (
                <ul className="nj-like-list">
                  {rest.map((o, i) => (
                    <li key={o.url || o.note || i}>
                      {o.favorite && <span className="nj-like-star">★</span>}
                      {o.url ? (
                        <a href={o.url} target="_blank" rel="noopener noreferrer" className="nj-like-main">
                          {o.note || o.url} ↗
                        </a>
                      ) : (
                        <span className="nj-like-main">{o.note}</span>
                      )}
                      {o.added && <span className="nj-like-date"> · added {formatAdded(o.added)}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </>
          );
        })()}
      </Accordion>

    </>
  );
}
