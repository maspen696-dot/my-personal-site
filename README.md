# Personal Site Template

A minimalist personal website — **Next.js on Cloudflare Workers** (via
[OpenNext](https://opennext.js.org/cloudflare)) — with a blog, an "adventures"
link-out section, a "things I like" collection (books / movies / quotes / videos
/ articles / albums), a projects page, and a spam-protected contact form.

It's the open-source, de-personalized version of my own site. Fork it, drop in
your content, and deploy your own in an afternoon.

## Features
- **Content ingesters** — pull your blog + "adventures" posts from Substack
  (`npm run import:content`), and add books/movies/quotes/etc. from the terminal
  (`npm run add:quotes`, `add:books`, …) with automatic enrichment
  (Open Library, Wikipedia, Spotify/YouTube oEmbed).
- **Contact form** — Cloudflare Turnstile + Resend, all via env vars.
- **Newsletter subscribe boxes** — context-matched per section.
- Sticky nav, mobile hamburger, reading-progress bar, live footer clock, a
  version counter, sitemap/robots, and a pre-launch "under construction"
  placeholder you flip with one boolean.

## Quick start
```bash
npm install
npm run dev            # http://localhost:3000
```
Then make it yours:
1. **`site.config.ts`** — your name, domain, links, and newsletters (one file).
2. **`content/`** — replace the sample JSON with your own (or run the ingesters).
3. **`public/`** — swap `headshot.svg` for your photo; regenerate `og.png`.
4. **`wrangler.jsonc`** — set your Worker name + route/zone.
5. **Secrets** — copy `.dev.vars.example` → `.dev.vars` and fill in
   `RESEND_API_KEY` / `TURNSTILE_SECRET` for local contact-form testing.

## Deploy (Cloudflare)
```bash
npm run deploy         # opennextjs-cloudflare build && deploy
```
Set production secrets with `npx wrangler secret put RESEND_API_KEY` (and
`TURNSTILE_SECRET`). Flip `SITE_LIVE = true` in `lib/site.ts` when you're ready
to go public.

## What's intentionally NOT here
This template is a clean, generic starting point: it ships with sample content
and leaves out any site-specific features, so you can drop in your own.

## License
MIT — see `LICENSE`. Content you add is yours.
