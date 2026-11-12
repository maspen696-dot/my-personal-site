"use client";

import { useState } from "react";
import Link from "next/link";

// Context-matched Substack subscribe box (My Newsletter on /blog, Adventures on
// /adventures). Substack's subscribe API returns no CORS headers to this
// origin, so a readable cross-origin fetch is impossible — the POST is
// fire-and-forget (mode: "no-cors", opaque response). Substack uses double
// opt-in, so we optimistically show "check your inbox" and let the confirmation
// email close the loop. A direct Substack link is offered as a safety net and
// as the cross-recommendation to the *other* newsletter.
//
// Note: no explicit Content-Type header — under no-cors the browser would strip
// a non-safelisted one anyway; Substack parses the raw JSON body regardless.

type Status = "idle" | "submitting" | "done" | "error";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function NewsletterSubscribe({
  publication,
  domain,
  otherName,
  otherUrl,
  otherPitch,
  atTop = false,
}: {
  publication: string; // "My Newsletter"
  domain: string; // "yourname.substack.com"
  otherName: string; // "My Adventures"
  otherUrl: string; // internal path to the other section, e.g. "/adventures"
  otherPitch: string; // "More of a trail person?"
  atTop?: boolean; // true on listing pages: sits below the intro, above the
  // entries — bottom divider instead of top, so it reads as its own block.
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      await fetch(`https://${domain}/api/v1/free`, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ email: value, source: "embed" }),
      });
    } catch {
      // no-cors POSTs don't surface HTTP errors; only a true network failure
      // throws. Either way Substack may still have received it, but be honest.
    }
    setStatus("done");
  }

  return (
    <aside className={atTop ? "nj-subscribe nj-subscribe-top" : "nj-subscribe"}>
      {status === "done" ? (
        <p className="nj-subscribe-done">
          Thanks! Check your inbox to confirm your subscription to {publication}.
        </p>
      ) : (
        <form className="nj-subscribe-form" onSubmit={onSubmit}>
          <div className="nj-subscribe-head">
            <strong>Subscribe to {publication}</strong>
          </div>
          <div className="nj-subscribe-row">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status === "error") setStatus("idle");
              }}
              aria-label={`Email address to subscribe to ${publication}`}
              required
            />
            <button
              type="submit"
              className="nj-btn"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Subscribing…" : "Subscribe →"}
            </button>
          </div>
          {status === "error" && (
            <p className="nj-subscribe-err">
              Please enter a valid email — or{" "}
              <a
                href={`https://${domain}/subscribe`}
                target="_blank"
                rel="noopener noreferrer"
              >
                subscribe on Substack
              </a>
              .
            </p>
          )}
        </form>
      )}
      <p className="nj-subscribe-cross">
        {otherPitch}{" "}
        <Link href={otherUrl}>{otherName} →</Link>
      </p>
    </aside>
  );
}
