"use client";

import { usePathname } from "next/navigation";

// Footer "Colophon" link — turns accent blue while on the colophon page.
export default function ColophonLink() {
  const active = usePathname() === "/colophon";
  return (
    <a
      href="/colophon"
      className={active ? "here" : undefined}
      aria-current={active ? "page" : undefined}
    >
      Colophon
    </a>
  );
}
