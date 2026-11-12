import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Things I've built — small apps and side projects.",
};

// Each tile links to a project. Use `external: true` for off-site links (a live
// app, a write-up, a repo) — those open in a new tab. Internal links (like the
// colophon) open in-tab. Replace these samples with your own.
const PROJECTS = [
  {
    title: "Sample App",
    href: "https://example.com",
    desc: "A short description of something you built. What it does and why it's fun.",
    external: true,
  },
  {
    title: "Sample Write-up",
    href: "https://example.com",
    desc: "A project you'd rather link to an article about than host live.",
    external: true,
  },
  {
    title: "This site",
    href: "/colophon",
    desc: "How this site is built — the stack and the story.",
  },
];

export default function Projects() {
  return (
    <>
      <h1 className="nj-page-title">Projects</h1>
      <p className="nj-page-intro">
        Things I&rsquo;ve made and built. More to come!
      </p>

      <div className="nj-proj-list">
        {PROJECTS.map((p) => (
          <a
            key={p.href}
            href={p.href}
            className="nj-proj"
            {...(p.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            <span className="nj-proj-title">
              {p.title} <span className="nj-proj-arrow">↗</span>
            </span>
            <span className="nj-proj-desc">{p.desc}</span>
          </a>
        ))}
      </div>
    </>
  );
}
