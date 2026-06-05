/**
 * Build-time content pipeline.
 *
 * Walks /content, converts each supported file to text (.docx via mammoth,
 * everything else read as UTF-8), runs the matching parser strategy, validates,
 * de-duplicates, and writes the universal question bank to
 * src/data/questions.generated.json.
 *
 * Runs automatically before `dev` and `build` (see package.json predev/prebuild),
 * so Vercel never reads the filesystem at runtime — the game imports the JSON.
 *
 * Fails loudly (non-zero exit) on malformed input or an empty bank.
 */
import { readFile, readdir, mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import mammoth from "mammoth";

import type { Question } from "../src/content/types";
import { resolveParser, SUPPORTED_EXTENSIONS } from "../src/content/parsers";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = join(ROOT, "content");
const OUT_FILE = join(ROOT, "src", "data", "questions.generated.json");

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return Promise.resolve([full]);
    }),
  );
  return files.flat();
}

async function toText(path: string, ext: string): Promise<string> {
  if (ext === ".docx") {
    const { value } = await mammoth.extractRawText({ path });
    return value;
  }
  return readFile(path, "utf8");
}

async function main() {
  try {
    await stat(CONTENT_DIR);
  } catch {
    throw new Error(`content directory not found at ${CONTENT_DIR}`);
  }

  const allFiles = await walk(CONTENT_DIR);
  const supported = allFiles.filter((f) => SUPPORTED_EXTENSIONS.has(extname(f).toLowerCase()));

  if (supported.length === 0) {
    throw new Error(
      `no supported question files in /content (looked for ${[...SUPPORTED_EXTENSIONS].join(", ")})`,
    );
  }

  const byId = new Map<string, Question>();
  let parsedCount = 0;

  for (const file of supported.sort()) {
    const ext = extname(file).toLowerCase();
    const rel = relative(ROOT, file);
    const parser = resolveParser(ext);
    if (!parser) continue;

    const text = await toText(file, ext);
    const questions = parser.parse(text, rel);
    parsedCount += questions.length;
    for (const q of questions) byId.set(q.id, q); // later files override duplicates by id
    console.log(`[build-questions] ${rel}: ${questions.length} question(s)`);
  }

  const questions = [...byId.values()];
  if (questions.length === 0) {
    throw new Error("parsed 0 questions — check the file format in /content");
  }

  await mkdir(dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(questions, null, 2)}\n`, "utf8");

  const dupes = parsedCount - questions.length;
  console.log(
    `[build-questions] wrote ${questions.length} question(s) to ${relative(ROOT, OUT_FILE)}` +
      (dupes > 0 ? ` (${dupes} duplicate(s) merged)` : ""),
  );
}

main().catch((err: unknown) => {
  console.error(`[build-questions] ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
