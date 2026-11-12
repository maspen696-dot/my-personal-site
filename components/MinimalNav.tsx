"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/site.config";

const links: { href: string; label: string; title?: string }[] = [
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/adventures", label: "Adventures" },
  { href: "/things-i-like", label: "Things I like" },
  { href: "/contact", label: "Contact" },
];

export default function MinimalNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    // The colophon is the "This site" project, so highlight Projects there too.
    if (href === "/projects" && pathname === "/colophon") return true;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="nj-nav">
      <Link
        href="/"
        className={pathname === "/" ? "nj-nav-name here" : "nj-nav-name"}
        aria-current={pathname === "/" ? "page" : undefined}
      >
        {siteConfig.name}
      </Link>

      {/* Hamburger — only shown on narrow screens (CSS). */}
      <button
        type="button"
        className="nj-nav-toggle"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "✕" : "☰"}
      </button>

      <ul className={open ? "nj-nav-links open" : "nj-nav-links"}>
        {links.map(({ href, label, title }) => (
          <li key={href}>
            <Link
              href={href}
              title={title}
              className={isActive(href) ? "here" : undefined}
              aria-current={isActive(href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
