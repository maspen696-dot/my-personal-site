"use client";

import { useState } from "react";
import Script from "next/script";
import { siteConfig } from "@/site.config";

// Turnstile site key (public — it's rendered in the page). Defaults to
// Cloudflare's always-pass TEST key; set siteConfig.turnstileSiteKey (or the
// NEXT_PUBLIC_TURNSTILE_SITE_KEY env var) to your real key, whitelisted for
// your domain + localhost.
const SITE_KEY = siteConfig.turnstileSiteKey;

type Status = "idle" | "sending" | "sent" | "error";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: data.get("name"),
      email: data.get("email"),
      message: data.get("message"),
      token: data.get("cf-turnstile-response"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (res.ok && json.ok) {
        setStatus("sent");
        form.reset();
      } else {
        setStatus("error");
        setError(json.error ?? "Something went wrong.");
        resetTurnstile();
      }
    } catch {
      setStatus("error");
      setError("Network error — please try again or email me directly.");
      resetTurnstile();
    }
  }

  // A Turnstile token is single-use — once a submit fails, the widget must be
  // reset or every retry fails until a full page reload.
  function resetTurnstile() {
    (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
      />

      <h1 className="nj-page-title">Contact</h1>
      <p className="nj-page-intro">
        Have a question, an idea, or just want to say hi? Want to collab on a
        project or send me a postcard? Simply want to troll? Something else
        entirely?
        <br />
        Reach out below or email me directly at{" "}
        {/* Obfuscated (no mailto:) to deter scrapers. */}
        <span className="nj-email">contact [at] example [dot] com</span>!
      </p>

      {status === "sent" ? (
        <p className="nj-form-sent">
          Thanks for your message! I&apos;ll reach out soon :)
        </p>
      ) : (
        <form className="nj-form" onSubmit={onSubmit}>
          <label className="nj-field">
            <span>Name</span>
            <input type="text" name="name" required autoComplete="name" />
          </label>
          <label className="nj-field">
            <span>Email</span>
            <input type="email" name="email" required autoComplete="email" />
          </label>
          <label className="nj-field">
            <span>Message</span>
            <textarea name="message" rows={6} required />
          </label>

          <div className="cf-turnstile" data-sitekey={SITE_KEY} />

          <div className="nj-form-actions">
            <button
              type="submit"
              className="nj-btn"
              disabled={status === "sending"}
            >
              {status === "sending" ? "Sending…" : "Send →"}
            </button>
            {status === "error" && <span className="nj-form-err">{error}</span>}
          </div>
        </form>
      )}
    </>
  );
}
