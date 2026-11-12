// Walk a "Things I like" category to star your favorites and fix any mistakes.
//
//   npm run pin:books
//   npm run pin:movies
//
// Starred entries render first (with a ★) on /things-i-like; the rest stay in
// order. Use [e] to correct a wrong title / author / year inline.
//
// Keys:  [f] star   [x] unstar   [e] edit   [→/space] next   [←/b] back   [q] save & quit
//
// Non-interactive (if you already know your picks): pipe the entry numbers —
//   echo "1 4 9" | npm run pin:books    → stars exactly those, unstars the rest

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

// First field is the title; `meta: true` fields show in parentheses in the list
// view (all fields are editable via [e]).
const SCHEMA = {
  books: [
    { k: "title", label: "Title" },
    { k: "author", label: "Author", meta: true },
  ],
  movies: [
    { k: "title", label: "Title" },
    { k: "year", label: "Year", meta: true },
  ],
  videos: [
    { k: "title", label: "Title" },
    { k: "url", label: "URL" },
  ],
  articles: [
    { k: "title", label: "Title" },
    { k: "author", label: "Author", meta: true },
    { k: "url", label: "URL" },
  ],
  other: [
    { k: "note", label: "Note" },
    { k: "url", label: "Link" },
  ],
};

const category = (process.argv[2] || "").toLowerCase();
const fields = SCHEMA[category];
if (!fields) {
  console.error("Usage: node scripts/pin-likes.mjs <books|movies>");
  process.exit(1);
}

const FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
  "likes.json",
);
const likes = JSON.parse(readFileSync(FILE, "utf8"));
const list = Array.isArray(likes[category])
  ? likes[category]
  : (likes[category] = []);
const save = () => writeFileSync(FILE, JSON.stringify(likes, null, 2) + "\n");
const favCount = () => list.filter((x) => x.favorite).length;

// Spotify album/episode titles live in a separate file (not likes.json), so
// "other" rows can show the album name alongside your note instead of just the
// note. Optional — falls back gracefully if the file isn't there.
let spotifyMeta = {};
try {
  spotifyMeta = JSON.parse(
    readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "content", "spotify-meta.json"), "utf8"),
  );
} catch {}

function setFav(x, on) {
  if (on) x.favorite = true;
  else delete x.favorite;
}
function label(x) {
  const meta = fields
    .filter((f) => f.meta)
    .map((f) => x[f.k])
    .filter(Boolean)
    .join(", ");
  // Spotify entries (in "other"): lead with the album/episode title so you know
  // what you're starring, then show your note.
  const spTitle = x.url && spotifyMeta[x.url] ? spotifyMeta[x.url].title : null;
  const name = x.title || spTitle || x.note || x.url || "(untitled)";
  let suffix = meta ? ` (${meta})` : "";
  if (spTitle && x.note) suffix += ` — “${x.note}”`;
  return name + suffix;
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
        .filter((n) => n >= 1 && n <= list.length),
    );
    list.forEach((x, i) => setFav(x, nums.has(i + 1)));
    save();
    console.log(`Starred ${nums.size} ${category}.`);
    process.exit(0);
  });
} else {
  let i = 0;
  try {
    process.stdin.setRawMode(true);
  } catch {}
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  const render = () => {
    const x = list[i];
    process.stdout.write("\x1b[2J\x1b[H");
    process.stdout.write(`Starring ${category} — ★ ${favCount()} starred\n`);
    process.stdout.write(
      `${i + 1} / ${list.length}   ${x.favorite ? "★ FAVORITE" : "· not starred"}\n\n`,
    );
    process.stdout.write(`  ${label(x)}\n`);
    process.stdout.write(
      `\n[f] star   [x] unstar   [e] edit   [→/space] next   [←/b] back   [q] save & quit\n`,
    );
  };

  // Edit each field inline (pre-filled, editable). Blank clears an optional
  // field; a blank Title keeps the existing one.
  function editEntry() {
    const x = list[i];
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
    rl.on("SIGINT", restore);

    process.stdout.write("\x1b[2J\x1b[H");
    process.stdout.write("Editing — edit each line, Enter to advance. Ctrl-C cancels.\n\n");

    let idx = 0;
    const askNext = () => {
      if (idx >= fields.length) {
        save();
        return restore();
      }
      const f = fields[idx];
      rl.question(`${f.label}: `, (ans) => {
        const v = ans.trim();
        if (f.k === "title") {
          if (v) x.title = v;
        } else if (v) x[f.k] = v;
        else delete x[f.k];
        idx++;
        askNext();
      });
      rl.write(x[f.k] || "");
    };
    askNext();
  }

  const finish = () => {
    save();
    try {
      process.stdin.setRawMode(false);
    } catch {}
    process.stdout.write(`\n✓ Saved — ${favCount()} ${category} starred.\n`);
    process.exit(0);
  };
  const advance = () => {
    if (i < list.length - 1) {
      i++;
      render();
    } else finish();
  };

  function onKey(key) {
    if (key === "\x03" || key === "q" || key === "Q") return finish();
    if (key === "f" || key === "F") {
      setFav(list[i], true);
      save();
      return advance();
    }
    if (key === "x" || key === "X") {
      setFav(list[i], false);
      save();
      return advance();
    }
    if (key === "e" || key === "E") return editEntry();
    if (key === " " || key === "\r" || key === "\x1b[C" || key === "j") return advance();
    if ((key === "\x1b[D" || key === "b" || key === "k") && i > 0) {
      i--;
      render();
    }
  }

  render();
  process.stdin.on("data", onKey);
}
