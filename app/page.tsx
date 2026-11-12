import { siteConfig } from "@/site.config";

export default function Home() {
  return (
    <div className="nj-home">
      {/* Visually hidden but present for a11y/SEO (the name shows in the nav). */}
      <h1 className="nj-sr-only">{siteConfig.name}</h1>
      <div className="nj-home-media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/headshot.svg"
          alt={siteConfig.name}
          className="nj-home-photo"
        />
      </div>

      <div className="nj-bio">
        <p>
          Hi there! I&rsquo;m {siteConfig.name} — {siteConfig.tagline} This is
          the intro paragraph. Replace it with a sentence or two about who you
          are and what you&rsquo;re into.
        </p>
        <p>
          A second paragraph for a bit more color: what you&rsquo;ve done, what
          you&rsquo;re building, what you&rsquo;re curious about. Keep it warm
          and human — this is the first thing visitors read.
        </p>
        <p>
          In the meantime, check out my <a href="/projects">projects</a>,{" "}
          <a href="/blog">blog</a>, <a href="/adventures">adventures</a>, and{" "}
          <a href="/things-i-like">things I like</a> — or{" "}
          <a href="/contact">reach out</a>.
        </p>
        <p>
          Cheers,
          <br />
          {siteConfig.name}
        </p>
      </div>
    </div>
  );
}
