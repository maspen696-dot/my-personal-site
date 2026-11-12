import tiles from "@/content/adventures/manifest.json";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { ADVENTURES_SUBSCRIBE } from "@/lib/newsletters";

type Tile = { title: string; date: string; link: string; cover: string | null };

function shortDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function Adventures() {
  const posts = tiles as Tile[];

  return (
    <>
      <h1 className="nj-page-title">Adventures</h1>
      <p className="nj-page-intro">
        Trail dispatches, travel stories, and notes from wherever I am. I
        started this blog back in 2023 while studying abroad in Paris, and have
        kept it up ever since! These are hosted on{" "}
        <a
          href="https://www.example.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Substack
        </a>{" "}
        as they have unlimited free image storage and these blogs have, well, a
        LOT of images :)
      </p>

      <NewsletterSubscribe {...ADVENTURES_SUBSCRIBE} atTop />

      <div className="nj-tiles">
        {posts.map((post) => (
          <a
            key={post.link}
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="nj-tile"
          >
            {post.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.cover}
                alt={post.title}
                className="nj-tile-img"
                loading="lazy"
              />
            ) : (
              <div className="nj-tile-img nj-tile-img-empty" aria-hidden="true" />
            )}
            <div className="nj-tile-body">
              <div className="nj-tile-date">{shortDate(post.date)}</div>
              <h2 className="nj-tile-title">{post.title}</h2>
            </div>
          </a>
        ))}
      </div>
    </>
  );
}
