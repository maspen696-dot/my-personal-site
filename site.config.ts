// ─────────────────────────────────────────────────────────────────────────
//  SITE CONFIG — fill this in to make the template yours.
//  Everything identity-related (name, domain, links, newsletters) lives here
//  so you can personalize the site by editing ONE file.
// ─────────────────────────────────────────────────────────────────────────

export const siteConfig = {
  // Your name, as shown in the nav, footer, and metadata.
  name: "Your Name",

  // Bare domain (no protocol) and full URL. Used in metadata, sitemap, robots.
  domain: "example.com",
  url: "https://example.com",

  // One-line identity, shown on the OG share card and in meta descriptions.
  tagline: "Writer, maker, explorer.",

  // Where you're based. `location` is used in copy (e.g. the contact page).
  // `timezone` (an IANA name) + `timezoneLabel` drive the live footer clock.
  location: "your city",
  timezone: "America/Los_Angeles",
  timezoneLabel: "PT",

  // Contact-form destination (the address you receive messages at). Can be
  // overridden per-environment with the CONTACT_TO Worker secret.
  contactEmail: "you@example.com",
  // Verified sender on your Resend-verified domain (see README → contact form).
  contactFrom: "Your Name <contact@example.com>",

  // Footer / social links. Leave a field empty ("") to hide that link.
  social: {
    github: "https://github.com/yourhandle",
    linkedin: "https://www.linkedin.com/in/yourhandle",
  },

  // The two Substack newsletters the subscribe boxes point at. If you only
  // have one, point both at it (or delete the /adventures section).
  newsletters: {
    blog: { name: "My Newsletter", domain: "yourname.substack.com" },
    adventures: { name: "My Adventures", domain: "youradventures.substack.com" },
  },

  // Cloudflare Turnstile (spam protection on the contact form). The default is
  // Cloudflare's official "always passes" TEST key — replace with your real
  // public site key, or set NEXT_PUBLIC_TURNSTILE_SITE_KEY.
  turnstileSiteKey:
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA",
} as const;
