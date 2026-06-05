import type { QuestionParser } from "../types";
import { nativeTextParser } from "./nativeText";
import { jsonParser } from "./json";

/** All registered text-based parsing strategies. */
export const PARSERS: readonly QuestionParser[] = [nativeTextParser, jsonParser];

/** File extensions that the build pipeline knows how to read. */
export const SUPPORTED_EXTENSIONS = new Set<string>([
  ...PARSERS.flatMap((p) => p.extensions),
  ".docx", // extracted to text upstream, then parsed as native text
]);

/**
 * Resolve the parser for a given file extension (with leading dot, any case).
 * `.docx` is converted to plain text by the build script and then parsed with
 * the native-text strategy, so it maps here too.
 */
export function resolveParser(ext: string): QuestionParser | undefined {
  const e = ext.toLowerCase();
  if (e === ".docx") return nativeTextParser;
  return PARSERS.find((p) => p.extensions.includes(e));
}

export { nativeTextParser, jsonParser };
