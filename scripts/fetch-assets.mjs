// Verifies the 3D dancer assets are present in /public/models.
//
// The dancer is a custom (Mixamo-sourced) human model delivered as three
// single-clip FBX files that share one skeleton:
//   - dance.fbx -> default looping state (Macarena)
//   - cheer.fbx -> success reaction
//   - fall.fbx  -> the "fall to the ground" reaction
//
// Unlike the old CC0 robot, these have no public download URL — they are
// committed to the repo. This step just asserts they exist so a build fails
// loudly (rather than at runtime) if a file is missing.
//
// Run via `npm run fetch:assets`.

import { stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "models");
const REQUIRED = ["dance.fbx", "cheer.fbx", "fall.fbx"];

async function exists(path) {
  try {
    const s = await stat(path);
    return s.size > 0;
  } catch {
    return false;
  }
}

async function main() {
  const missing = [];
  for (const name of REQUIRED) {
    if (!(await exists(join(OUT_DIR, name)))) missing.push(name);
  }
  if (missing.length === 0) {
    console.log(`[fetch-assets] dancer assets present (${REQUIRED.join(", ")}).`);
    return;
  }
  throw new Error(
    `Missing dancer asset(s) in public/models/: ${missing.join(", ")}\n` +
      `Add the committed Mixamo FBX files (dance / cheer / fall).`,
  );
}

main().catch((err) => {
  console.error(`[fetch-assets] ${err.message}`);
  process.exit(1);
});
