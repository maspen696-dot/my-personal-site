"use client";

import { useEffect, useState } from "react";

// Collapsible section (home + Things I like). Minimal njbrown styling — a ▸/▾
// toggle with a hairline divider. Collapsed by default.
//
// openOnHashPrefix: if set, the section auto-expands when the page URL's hash
// starts with that prefix (e.g. "#quote-"), so a shared deep link opens it.
export default function Accordion({
  title,
  children,
  defaultOpen = false,
  openOnHashPrefix,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  openOnHashPrefix?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (openOnHashPrefix && window.location.hash.startsWith(openOnHashPrefix)) {
      setOpen(true);
    }
  }, [openOnHashPrefix]);

  return (
    <section className="nj-acc">
      <button
        type="button"
        className="nj-acc-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nj-acc-caret" aria-hidden="true" />
        {title}
      </button>
      {open && <div className="nj-acc-body">{children}</div>}
    </section>
  );
}
