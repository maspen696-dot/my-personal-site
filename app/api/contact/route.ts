// Contact form handler: verifies the Cloudflare Turnstile token, then emails
// the message to you via Resend.
//
// Secrets (set on the Worker before launch — `npx wrangler secret put NAME`):
//   TURNSTILE_SECRET   Turnstile secret key   (falls back to the always-pass
//                      test secret if unset, so preview works without keys)
//   RESEND_API_KEY     Resend API key         (if unset, the message is logged
//                      server-side and the form still succeeds — preview mode)
//   CONTACT_TO         destination address    (default: siteConfig.contactEmail)
//   CONTACT_FROM       verified Resend sender  (default: siteConfig.contactFrom)

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { siteConfig } from "@/site.config";

export const dynamic = "force-dynamic";

// Cloudflare's official "always passes" Turnstile test secret.
const TEST_SECRET = "1x0000000000000000000000000000000AA";

type Secrets = {
  TURNSTILE_SECRET?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
};

async function verifyTurnstile(token: string, secret: string, ip: string | null) {
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form },
  );
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; message?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const token = typeof body.token === "string" ? body.token : "";

  if (!name || !email || !message) {
    return Response.json(
      { ok: false, error: "Please fill in every field." },
      { status: 400 },
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json(
      { ok: false, error: "That email doesn't look right." },
      { status: 400 },
    );
  }
  // Length caps — reject oversized payloads before doing any work.
  if (name.length > 100 || email.length > 200 || message.length > 5000) {
    return Response.json(
      { ok: false, error: "That's a bit too long — please shorten it." },
      { status: 400 },
    );
  }

  const env = getCloudflareContext().env as unknown as Secrets;
  const ip = request.headers.get("cf-connecting-ip");

  // Wrap verification so a Turnstile outage returns a clean 503, not a 500.
  let ok = false;
  try {
    ok = await verifyTurnstile(token, env.TURNSTILE_SECRET ?? TEST_SECRET, ip);
  } catch {
    return Response.json(
      { ok: false, error: "Anti-spam check is unavailable — please try again shortly." },
      { status: 503 },
    );
  }
  if (!ok) {
    return Response.json(
      { ok: false, error: "Anti-spam check failed — please try again." },
      { status: 400 },
    );
  }

  const to = env.CONTACT_TO ?? siteConfig.contactEmail;
  // From address must be on your Resend-verified domain (see README → contact).
  // The visitor's address is set as reply_to below, so replies go to them.
  const from = env.CONTACT_FROM ?? siteConfig.contactFrom;
  const subject = `New message from ${name} via ${siteConfig.domain}`;
  const text = `From: ${name} <${email}>\n\n${message}`;

  // No provider configured yet → log + succeed so the form works in preview.
  if (!env.RESEND_API_KEY) {
    console.warn("[contact] RESEND_API_KEY unset — message not emailed:", {
      name,
      email,
      message,
    });
    return Response.json({ ok: true, note: "logged (email provider not configured)" });
  }

  const send = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, reply_to: email }),
  });

  if (!send.ok) {
    console.error("[contact] Resend failed:", send.status, await send.text());
    return Response.json(
      { ok: false, error: "Couldn't send right now — try email directly." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
