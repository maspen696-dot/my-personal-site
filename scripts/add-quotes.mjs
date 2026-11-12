// Interactive quote entry — ONE PASTE = ONE QUOTE.
//
//   npm run add:quotes
//
// Paste a quote (any length, any number of lines) and it's saved as a single
// quote. Uses the terminal's "bracketed paste" mode to capture the whole paste
// as one unit, so multi-line quotes / dialogues / lists no longer get split.
// Type "stop" then Enter to finish. Ctrl-C also exits.
//
// If a paste ends with an attribution line ("— Author") or a single-line quote
// ends with " — Author", the author is split into its own field automatically.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
  "quotes.json",
);

const PASTE_START = "\x1b[200~";
const PASTE_END = "\x1b[201~";

function stripWrap(s) {
  return s.replace(/^["“”'‘’]+\s*/, "").replace(/\s*["“”'‘’]+$/, "").trim();
}

// Turn a raw paste into { text, author }. Preserves internal line breaks so
// dialogues/lists stay intact; peels a trailing attribution when present.
function parse(raw) {
  const text = raw.replace(/\r/g, "").replace(/^\n+|\n+$/g, "").trim();
  if (!text) return { text: "", author: "" };
  const lines = text.split("\n");
  if (lines.length > 1) {
    // last line is a standalone attribution, e.g. "— Chris Arnade, My Seoul…"
    const m = lines[lines.length - 1].trim().match(/^[—–-]\s*(.{2,80}\S)$/);
    if (m) {
      return { text: stripWrap(lines.slice(0, -1).join("\n").trim()), author: m[1].trim() };
    }
    return { text: stripWrap(text), author: "" };
  }
  // single line: peel an inline " — Author" (short, dash-free author)
  const m2 = text.match(/^(.*\S)\s+[—–-]\s*([^—–-]{2,60})$/);
  if (m2) return { text: stripWrap(m2[1]), author: m2[2].trim() };
  return { text: stripWrap(text), author: "" };
}

const quotes = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : [];

function save(raw) {
  const q = parse(raw);
  if (!q.text.trim()) return null;
  quotes.push(q);
  writeFileSync(FILE, JSON.stringify(quotes, null, 2) + "\n");
  return q;
}

function snippet(t) {
  const s = t.replace(/\s*\n\s*/g, " / ");
  return s.length > 64 ? s.slice(0, 64) + "…" : s;
}

if (process.stdin.isTTY) {
  // ── Interactive: bracketed paste, one paste = one quote ──
  try {
    process.stdin.setRawMode(true);
  } catch {
    /* fall through; some terminals disallow raw mode */
  }
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdout.write("\x1b[?2004h"); // enable bracketed paste

  const P = "quote> ";
  let inPaste = false;
  let pbuf = "";
  let typed = "";

  console.log(`\nLoaded ${quotes.length} quote(s). Each PASTE = one quote (multi-line is fine).`);
  console.log('Type "stop" then Enter to finish.\n');
  process.stdout.write(P);

  const finish = () => {
    process.stdout.write("\x1b[?2004l"); // disable bracketed paste
    try {
      process.stdin.setRawMode(false);
    } catch {}
    console.log(`\n✓ Done — ${quotes.length} quote(s) in content/quotes.json.`);
    process.exit(0);
  };

  process.stdin.on("data", (chunk) => {
    let s = chunk;
    while (s.length) {
      if (inPaste) {
        const e = s.indexOf(PASTE_END);
        if (e === -1) {
          pbuf += s;
          s = "";
        } else {
          pbuf += s.slice(0, e);
          s = s.slice(e + PASTE_END.length);
          inPaste = false;
          const q = save(pbuf);
          pbuf = "";
          process.stdout.write(
            q
              ? `\r\n  ✓ #${quotes.length} saved: "${snippet(q.text)}"${q.author ? "  — " + q.author : ""}\r\n${P}`
              : `\r\n${P}`,
          );
        }
        continue;
      }
      if (s.startsWith(PASTE_START)) {
        s = s.slice(PASTE_START.length);
        inPaste = true;
        continue;
      }
      // typed input, char by char (for "stop" / Ctrl-C)
      const ch = s[0];
      s = s.slice(1);
      if (ch === "\x03" || ch === "\x04") return finish(); // Ctrl-C / Ctrl-D
      if (ch === "\r" || ch === "\n") {
        const cmd = typed.trim().toLowerCase();
        if (cmd === "stop") return finish();
        if (typed.trim()) {
          const q = save(typed);
          process.stdout.write(q ? `\r\n  ✓ #${quotes.length} saved\r\n${P}` : `\r\n${P}`);
        } else {
          process.stdout.write(`\r\n${P}`);
        }
        typed = "";
      } else if (ch === "\x7f" || ch === "\b") {
        if (typed) {
          typed = typed.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else if (ch >= " ") {
        typed += ch;
        process.stdout.write(ch);
      }
    }
  });
} else {
  // ── Non-interactive (piped): parse bracketed blocks and/or lines ──
  let data = "";
  process.stdin.on("data", (d) => (data += d));
  process.stdin.on("end", () => {
    let i = 0;
    while (i < data.length) {
      const st = data.indexOf(PASTE_START, i);
      if (st === -1) {
        for (const line of data.slice(i).split("\n")) {
          if (line.trim().toLowerCase() === "stop") return end();
          if (line.trim()) save(line);
        }
        break;
      }
      for (const line of data.slice(i, st).split("\n")) {
        const t = line.trim();
        if (t && t.toLowerCase() !== "stop") save(line);
      }
      const e = data.indexOf(PASTE_END, st);
      save(data.slice(st + PASTE_START.length, e === -1 ? undefined : e));
      i = e === -1 ? data.length : e + PASTE_END.length;
    }
    end();
  });
  function end() {
    console.log(`Done — ${quotes.length} quote(s).`);
    process.exit(0);
  }
}
