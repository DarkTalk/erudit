import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const source = join(root, "russian_nouns.txt");
const output = join(root, "lib", "dictionary.json");

const text = readFileSync(source, "utf-8");
const words = text
  .split(/\r?\n/)
  .map((w) => w.trim().toLowerCase())
  .filter((w) => w.length >= 2 && /^[а-яё]+$/i.test(w));

writeFileSync(output, JSON.stringify(words));
console.log(`Dictionary: ${words.length} words → lib/dictionary.json`);
