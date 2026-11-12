import "./minimal-chrome.css";
import MinimalNav from "./MinimalNav";
import LocalTime from "./LocalTime";
import ColophonLink from "./ColophonLink";
import { SITE_VERSION } from "@/lib/site";
import { siteConfig } from "@/site.config";

// Site-wide minimal chrome, modeled on njbrown.com. Wraps every page (set in
// the root layout). Monochrome: white / ink / accent (see minimal-chrome.css).

export function MinimalFooter() {
  return (
    <footer className="nj-footer">
      <span>
        © {new Date().getFullYear()} {siteConfig.name} ·{" "}
        <ColophonLink />
        <LocalTime />
        {" "}&middot;{" "}
        <span className="nj-version" title="Site version — bumps with every content update">
          v{SITE_VERSION}
        </span>
      </span>
      <span className="nj-footer-links">
        {/* Links to the contact form rather than a mailto: — no raw email
            address in the HTML for scrapers to harvest. */}
        <a href="/contact">Email</a>
        {siteConfig.social.linkedin && (
          <a href={siteConfig.social.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
        )}
        {siteConfig.social.github && (
          <a href={siteConfig.social.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        )}
      </span>
    </footer>
  );
}

export default function MinimalChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="nj">
      <MinimalNav />
      <main className="nj-main">{children}</main>
      <MinimalFooter />
    </div>
  );
}
