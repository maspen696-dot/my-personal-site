// Walk through your quotes and pin your favorites. Pinned quotes render at the
// top of the /things-i-like Quotes section (with a ★); the rest stay in paste
// order. Favorites are stored as `"favorite": true` on the quote in quotes.json.
//
//   npm run pin:quotes
//
// Keys:  [f] pin favorite   [x] unpin   [→/space] next   [←/b] back   [q] quit
//
// Non-interactive (handy if you already know your picks): pipe the quote numbers
//   echo "3 17 42 88" | npm run pin:quotes    → pins exactly those, unpins rest

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
  "quotes.json",
);

const quotes = JSON.parse(readFileSync(FILE, "utf8"));
const save = () => writeFileSync(FILE, JSON.stringify(quotes, null, 2) + "\n");
const favCount = () => quotes.filter((q) => q.favorite).length;

function setFav(q, on) {
  if (on) q.favorite = true;
  else delete q.favorite;
}

if (!process.stdin.isTTY) {
  // Piped: read favorite numbers (space/comma/newline separated).
  let data = "";
  process.stdin.on("data", (d) => (data += d));
  process.stdin.on("end", () => {
    const nums = new Set(
      data
        .split(/[\s,]+/)
        .map((s) => parseInt(s, 10))
        .filter((n) => n >= 1 && n <= quotes.length),
    );
    quotes.forEach((q, i) => setFav(q, nums.has(i + 1)));
    save();
    console.log(`Pinned ${nums.size} favorite(s).`);
    process.exit(0);
  });
} else {
  // Interactive walk-through.
  let i = 0;
  try {
    process.stdin.setRawMode(true);
  } catch {}
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  const render = () => {
    const q = quotes[i];
    process.stdout.write("\x1b[2J\x1b[H"); // clear
    process.stdout.write(`Pinning favorites — ★ ${favCount()} pinned so far\n`);
    process.stdout.write(`Quote ${i + 1} / ${quotes.length}   ${q.favorite ? "★ FAVORITE" : "· not pinned"}\n\n`);
    // Full quote text (indent continuation lines of multi-line quotes).
    process.stdout.write(`  “${q.text.replace(/\n/g, "\n   ")}”\n`);
    const attrib = [q.author, q.source].filter(Boolean).join(", ");
    if (attrib) process.stdout.write(`      — ${attrib}\n`);
    if (q.sourceUrl) process.stdout.write(`        ↳ ${q.sourceUrl}\n`);
    process.stdout.write(`\n[f] pin   [x] unpin   [e] edit   [→/space] next   [←/b] back   [q] save & quit\n`);
  };

  // Edit the current quote's text/author inline — no external editor (that
  // traps anyone who doesn't know nano/vim). Real newlines are shown as "\n" so
  // a multi-line quote stays on one editable line; they're restored on save.
  // Enter saves each field; Ctrl-C cancels the edit and returns to browsing.
  const esc = (s) => s.replace(/\n/g, "\\n");
  const unesc = (s) => s.replace(/\\n/g, "\n");

  function editQuote() {
    const q = quotes[i];
    process.stdin.removeListener("data", onKey);
    try {
      process.stdin.setRawMode(false);
    } catch {}

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const restore = () => {
      rl.close();
      try {
        process.stdin.setRawMode(true);
      } catch {}
      process.stdin.resume();
      process.stdin.on("data", onKey);
      render();
    };

    // Ctrl-C (or any close) cancels without saving and returns to browsing.
    rl.on("SIGINT", restore);

    process.stdout.write("\x1b[2J\x1b[H");
    process.stdout.write("Editing this quote — edit each line, then press Enter to advance.\n");
    process.stdout.write('Type "\\n" in the text for a line break. Blank Source/URL clears it. Ctrl-C to cancel.\n\n');

    // Chained prompts, each pre-filled with the current value so you can edit
    // in place: Text → Author → Source (title) → Source URL.
    rl.question("Text:   ", (textAns) => {
      rl.question("Author: ", (authorAns) => {
        rl.question("Source (title): ", (sourceAns) => {
          rl.question("Source URL:     ", (urlAns) => {
            const text = unesc(textAns).trim();
            const author = unesc(authorAns).trim();
            const source = sourceAns.trim();
            const url = urlAns.trim();
            if (text) q.text = text;
            if (author) q.author = author;
            else delete q.author;
            if (source) q.source = source;
            else delete q.source;
            if (url) q.sourceUrl = url;
            else delete q.sourceUrl;
            save();
            restore();
          });
          rl.write(q.sourceUrl || "");
        });
        rl.write(q.source || "");
      });
      rl.write(esc(q.author || ""));
    });
    rl.write(esc(q.text));
  }

  const finish = () => {
    save();
    try {
      process.stdin.setRawMode(false);
    } catch {}
    process.stdout.write(`\n✓ Saved — ${favCount()} favorite(s) pinned.\n`);
    process.exit(0);
  };

  const advance = () => {
    if (i < quotes.length - 1) {
      i++;
      render();
    } else finish();
  };

  function onKey(key) {
    if (key === "\x03" || key === "q" || key === "Q") return finish();
    if (key === "f" || key === "F") {
      setFav(quotes[i], true);
      save();
      return advance();
    }
    if (key === "x" || key === "X" || key === "n") {
      setFav(quotes[i], false);
      save();
      return advance();
    }
    if (key === "e" || key === "E") return editQuote();
    if (key === " " || key === "\r" || key === "\x1b[C" || key === "j") return advance();
    if ((key === "\x1b[D" || key === "b" || key === "k") && i > 0) {
      i--;
      render();
    }
  }

  render();
  process.stdin.on("data", onKey);
}
