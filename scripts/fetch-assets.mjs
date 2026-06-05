// Downloads the 3D dancer asset into /public/models.
//
// We use the official three.js "RobotExpressive" model (CC0). It is a single
// self-contained GLB that already ships the animation clips this game needs:
//   - "Dance"      -> default looping state
//   - "Jump" / "ThumbsUp" / "Wave" -> success reactions
//   - "Death"      -> the "fall to the ground" reaction
//
// Run once via `npm run fetch:assets`. Idempotent: skips if the file exists.

import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "models");
const OUT_FILE = join(OUT_DIR, "RobotExpressive.glb");

// Primary + fallback mirrors of the same CC0 asset.
const SOURCES = [
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
  "https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb",
];

async function exists(path) {
  try {
    const s = await stat(path);
    return s.size > 0;
  } catch {
    return false;
  }
}

async function download(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function main() {
  if (await exists(OUT_FILE)) {
    console.log(`[fetch-assets] ${OUT_FILE} already present, skipping.`);
    return;
  }
  await mkdir(OUT_DIR, { recursive: true });

  let lastErr;
  for (const url of SOURCES) {
    try {
      console.log(`[fetch-assets] downloading ${url}`);
      const buf = await download(url);
      if (buf.length < 1024) throw new Error(`suspiciously small (${buf.length} bytes)`);
      await writeFile(OUT_FILE, buf);
      console.log(`[fetch-assets] wrote ${OUT_FILE} (${buf.length} bytes)`);
      return;
    } catch (err) {
      console.warn(`[fetch-assets] failed: ${err.message}`);
      lastErr = err;
    }
  }
  throw new Error(`Could not download dancer asset from any source: ${lastErr?.message}`);
}

main().catch((err) => {
  console.error(`[fetch-assets] ${err.message}`);
  process.exit(1);
});
