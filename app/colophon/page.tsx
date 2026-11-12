import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Colophon",
  description:
    "How example.com is built — the stack, the architecture, and the credits.",
};

export default function Colophon() {
  return (
    <>
      <h1 className="nj-page-title">Colophon</h1>
      <p className="nj-page-intro">
        Everything here is written and built by me, and the opinions are my own.
        This page briefly describes how this site runs.
      </p>

      <div className="nj-post-content">
        <h2>Stack</h2>
        <p>
          The site is a Next.js app (App Router) deployed to Cloudflare Workers
          via{" "}
          <a
            href="https://opennext.js.org/cloudflare"
            target="_blank"
            rel="noopener noreferrer"
          >
            OpenNext
          </a>
          . There is no Node server nor origin. The site runs at the edge, which
          keeps it fast and cheap but rules out a few conveniences (there&rsquo;s
          no runtime filesystem, so all content is bundled at build time).
        </p>

        <h2>Architecture</h2>
        <p>
          The whole site is a single Cloudflare Worker. Content lives as JSON
          bundled at build time (there&rsquo;s no runtime filesystem at the
          edge), and the pre-launch &ldquo;under construction&rdquo; screen is a
          one-line flag in <code>lib/site.ts</code>. If you host other small
          apps, you can front them under <code>/projects/&lt;name&gt;</code> with
          a second router worker &mdash; but that&rsquo;s optional.
        </p>

        <h2>Populating &ldquo;Things I Like&rdquo;</h2>
        <p>
          The writing on <a href="/blog">/blog</a> and{" "}
          <a href="/adventures">/adventures</a> is imported from my Substacks,
          where they were originally written and posted, then rendered natively
          here. I built the lists on{" "}
          <a href="/things-i-like">/things I like</a> with a set of command-line
          tools: I pasted in my favorite raw titles and links, then ran the
          bundled scripts to enrich them with authors, years, and links.
          Books link to their OpenLibrary entry, movies to their
          Wikipedia article, and albums to their Spotify page. Spotify is the
          elite music player and anyone who disagrees on this is wrong.
        </p>

        <h2>Design</h2>
        <p>
          This site&rsquo;s design is inspired by{" "}
          <a
            href="https://www.njbrown.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Nathan Brown
          </a>
          ,{" "}
          <a href="https://rhajjar.com/" target="_blank" rel="noopener noreferrer">
            Ralph Hajjar
          </a>
          , and{" "}
          <a
            href="https://www.slomojustin.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Justin Williams
          </a>
          . The contact form is protected by Cloudflare Turnstile and delivered
          with Resend. I specifically left out a <code>mailto:&nbsp;</code> so
          scrapers couldn&rsquo;t easily harvest my email. The social-share image
          is rendered with headless Chrome.
        </p>
      </div>
    </>
  );
}
