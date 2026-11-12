"use client";

import { useEffect, useState } from "react";
import quotes from "@/content/quotes.json";

type Quote = {
  text: string;
  author?: string;
  source?: string; // article / post / book / film title
  sourceUrl?: string; // the source is hyperlinked to this
  favorite?: boolean;
};

// "Author, Source" for copy/share text (plain, no link).
function cite(q: Quote) {
  return [q.author, q.source].filter(Boolean).join(", ");
}

const list = quotes as Quote[];

// Copy text to the clipboard, with a legacy fallback. navigator.clipboard is
// only defined in a secure context (https / localhost), so on an insecure
// origin (e.g. http://<lan-ip> during phone testing) it's undefined — guard it.
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// Quotes with copy / share, modeled on intrusivethinker.com.
// Favorites (pinned via `npm run pin:quotes`) render first; the rest stay in
// paste order. The per-quote number (`n`) is NO LONGER shown — it's used only
// as the stable #quote-N deep-link anchor (paste position, so share links stay
// valid regardless of display order) and the React key.
export default function QuotesList() {
  const [toast, setToast] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#quote-")) return;
    const el = document.querySelector(hash);
    if (!el) return;
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
    el.classList.add("nj-quote-hi");
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  function copyQuote(q: Quote) {
    const c = cite(q);
    const text = c ? `“${q.text}” — ${c}` : `“${q.text}”`;
    copyToClipboard(text).then((ok) => showToast(ok ? "Quote copied!" : "Couldn’t copy"));
  }

  function shareQuote(n: number, q: Quote) {
    const url = `${window.location.origin}/things-i-like#quote-${n}`;
    const c = cite(q);
    if (navigator.share) {
      navigator.share({ text: `“${q.text}”${c ? ` — ${c}` : ""}`, url }).catch(() => {});
    } else {
      copyToClipboard(url).then((ok) => showToast(ok ? "Link copied!" : "Couldn’t copy"));
    }
  }

  // Keep original paste number (stable anchor). Display order: favorites first,
  // then the rest — and within each of those blocks, quotes by the same author
  // are pulled together at that author's first appearance (paste order is
  // otherwise preserved). Unattributed quotes stay put as singletons so they
  // don't clump into one big group.
  const items = list.map((q, i) => ({ q, n: i + 1 }));
  const groupByAuthor = (arr: { q: Quote; n: number }[]) => {
    const groups: { q: Quote; n: number }[][] = [];
    const byKey = new Map<string, { q: Quote; n: number }[]>();
    for (const it of arr) {
      const author = (it.q.author || "").trim();
      const key = author ? `a:${author.toLowerCase()}` : `solo:${it.n}`;
      let g = byKey.get(key);
      if (!g) {
        g = [];
        byKey.set(key, g);
        groups.push(g);
      }
      g.push(it);
    }
    return groups.flat();
  };
  const ordered = [
    ...groupByAuthor(items.filter((it) => it.q.favorite)),
    ...groupByAuthor(items.filter((it) => !it.q.favorite)),
  ];
  const favCount = list.filter((q) => q.favorite).length;

  return (
    <div className="nj-quotes">
      <p className="nj-quotes-count">
        {favCount > 0 && `★ ${favCount} favorites · `}
        {list.length} quotes and counting
      </p>
      {ordered.map(({ q, n }) => (
        <div
          className={`nj-quote${q.favorite ? " nj-quote-fav" : ""}`}
          id={`quote-${n}`}
          key={n}
        >
          <p className="nj-quote-text">{q.text}</p>
          {(q.author || q.source) && (
            <p className="nj-quote-attrib">
              — {q.author}
              {q.author && q.source ? ", " : ""}
              {q.source &&
                (q.sourceUrl ? (
                  <a href={q.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {q.source}
                  </a>
                ) : (
                  q.source
                ))}
            </p>
          )}
          <div className="nj-quote-footer">
            <span className="nj-quote-meta">
              {q.favorite && <span className="nj-quote-star">★</span>}
            </span>
            <div className="nj-quote-actions">
              <button className="nj-icon-btn" title="Copy quote" onClick={() => copyQuote(q)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <button className="nj-icon-btn" title="Share" onClick={() => shareQuote(n, q)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
      {toast && <div className="nj-toast">{toast}</div>}
    </div>
  );
}
