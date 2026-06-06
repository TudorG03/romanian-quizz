import type { QuestionParser } from "../types";
import { nativeTextParser } from "./nativeText";
import { jsonParser } from "./json";
import { letteredMcqParser } from "./letteredMcq";

/** All registered text-based parsing strategies. */
export const PARSERS: readonly QuestionParser[] = [
  nativeTextParser,
  jsonParser,
  letteredMcqParser,
];

/** File extensions that the build pipeline knows how to read. */
export const SUPPORTED_EXTENSIONS = new Set<string>(PARSERS.flatMap((p) => p.extensions));

/**
 * Resolve the parser for a given file extension (with leading dot, any case).
 * `.docx` is extracted to plain text by the build script and parsed with the
 * lettered-MCQ strategy (numbered questions, `A./B.` options, `(C)` = correct).
 */
export function resolveParser(ext: string): QuestionParser | undefined {
  const e = ext.toLowerCase();
  return PARSERS.find((p) => p.extensions.includes(e));
}

export { nativeTextParser, jsonParser, letteredMcqParser };
