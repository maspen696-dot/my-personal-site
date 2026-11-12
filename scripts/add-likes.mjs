// Interactive entry for a "Things I like" category (books, movies, …).
//
//   npm run add:books      npm run add:movies      (paste TITLES)
//   npm run add:videos     npm run add:articles    (paste LINKS)
//   npm run add:other                              (link + note, per entry)
//
// For the single-field categories you paste one value per line — a whole list
// at once is fine. Everything else (authors, years, and the title/author
// extracted from each link) is filled in afterwards by a research pass.
//
// "other" is the misc bucket: each entry has a LINK and a NOTE. You're asked for
// the link, then the note, for each entry in turn.
//
// Type "stop" then Enter (or Ctrl-C) to finish. Entries are appended to
// content/likes.json under the chosen category.
//
// Non-interactive (piped) works too:
//   printf 'Dune\nProject Hail Mary\n' | npm run add:books
//   printf 'https://x.com | why I like it\n' | npm run add:other   (link | note)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

// Single-field categories: one value per line.
const FIELD = { books: "title", movies: "title", videos: "url", articles: "url" };
// Multi-field categories: each entry collects several fields in sequence.
const MULTI = {
  other: [
    { k: "url", label: "link" },
    { k: "note", label: "note" },
  ],
};

const category = (process.argv[2] || "").toLowerCase();
const field = FIELD[category];
const multi = MULTI[category];
if (!field && !multi) {
  const cats = [...Object.keys(FIELD), ...Object.keys(MULTI)].join("|");
  console.error(`Usage: node scripts/add-likes.mjs <${cats}>`);
  process.exit(1);
}
const noun = multi ? "entry" : field === "url" ? "link" : "title";

const FILE = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "content",
  "likes.json",
);

const likes = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};
if (!Array.isArray(likes[category])) likes[category] = [];
const save = () => writeFileSync(FILE, JSON.stringify(likes, null, 2) + "\n");

// Single-field: add one entry from a raw line. Returns true if saved.
function addEntry(raw) {
  const v = raw.trim();
  if (!v || v.toLowerCase() === "stop") return false;
  likes[category].push({ [field]: v });
  return true;
}
// Multi-field: push an object built from the collected fields (blanks dropped).
function addMulti(vals) {
  const entry = {};
  for (const f of multi) {
    const v = (vals[f.k] || "").trim();
    if (v) entry[f.k] = v;
  }
  if (!Object.keys(entry).length) return false;
  likes[category].push(entry);
  return true;
}

if (process.stdin.isTTY && multi) {
  // Multi-field interactive: ask each field per entry, in a loop.
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const finish = () => {
    rl.close();
    console.log(`\n✓ Done — ${likes[category].length} ${category} in content/likes.json.`);
    process.exit(0);
  };
  console.log(
    `\nAdding ${category} (${likes[category].length} so far). For each entry ` +
      `you'll enter a ${multi.map((f) => f.label).join(" then a ")}. ` +
      `"stop" on the ${multi[0].label} (or Ctrl-C) to finish.\n`,
  );

  const askEntry = () => {
    const vals = {};
    let idx = 0;
    const askField = () => {
      const f = multi[idx];
      rl.question(`${f.label}> `, (ans) => {
        if (idx === 0 && ans.trim().toLowerCase() === "stop") return finish();
        vals[f.k] = ans;
        idx++;
        if (idx < multi.length) return askField();
        if (addMulti(vals)) {
          save();
          console.log(`  ✓ #${likes[category].length}: ${vals[multi[0].k].trim()}`);
        }
        askEntry();
      });
    };
    askField();
  };
  askEntry();
  rl.on("SIGINT", finish);
} else if (process.stdin.isTTY) {
  // Single-field interactive: one value per line.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${noun}> `,
  });
  const finish = () => {
    rl.close();
    console.log(
      `\n✓ Done — ${likes[category].length} ${category} in content/likes.json. ` +
        `I'll fill in the details next.`,
    );
    process.exit(0);
  };
  console.log(
    `\nAdding ${category} (${likes[category].length} so far). One ${noun} per ` +
      `line — paste a whole list if you like. "stop" or Ctrl-C to finish.\n`,
  );
  rl.prompt();
  rl.on("line", (line) => {
    if (line.trim().toLowerCase() === "stop") return finish();
    if (addEntry(line)) {
      save();
      console.log(`  ✓ #${likes[category].length}: ${line.trim()}`);
    }
    rl.prompt();
  });
  rl.on("SIGINT", finish);
} else {
  // Piped. Single-field: one value per line. Multi-field: "field1 | field2 | …".
  let data = "";
  process.stdin.on("data", (d) => (data += d));
  process.stdin.on("end", () => {
    let added = 0;
    for (const line of data.split("\n")) {
      if (multi) {
        if (!line.trim() || line.trim().toLowerCase() === "stop") continue;
        const parts = line.split("|");
        const vals = {};
        multi.forEach((f, i) => (vals[f.k] = parts[i] || ""));
        if (addMulti(vals)) added++;
      } else if (addEntry(line)) added++;
    }
    save();
    console.log(`Added ${added} to ${category} — ${likes[category].length} total.`);
    process.exit(0);
  });
}
