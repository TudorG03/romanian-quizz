import type { Question, QuestionParser } from "../types";
import { hashId } from "../hash";

/**
 * Parser for the native authoring format (`.txt` / `.md`).
 *
 * Format — blocks separated by a blank line or a `---` rule:
 *
 *   Q: Cine a scris poemul „Luceafărul"?
 *   A) Mihai Eminescu *
 *   B) Ion Creangă
 *   ---
 *   Q: „A fost odată ca niciodată" introduce un text de tip…
 *   - basm *
 *   - fabulă
 *
 * Rules:
 *  - The question line may start with `Q:`, `Î:`, `Întrebare:` (case-insensitive)
 *    or simply be the first non-option line of the block.
 *  - Each answer line starts with `A)`/`B)`/`a.`/`-`/`*`/`•`.
 *  - The correct answer is flagged by a trailing `*`, `[x]`, `(corect)` or `(correct)`.
 *  - Lines starting with `#` are treated as comments and ignored.
 *  - Exactly two options, exactly one correct — anything else throws.
 */

const QUESTION_RE = /^(?:Q|Î|I|Intrebare|Întrebare)[:.)]\s*(.+)$/i;
const OPTION_RE = /^(?:[A-Da-d][).]|[-*•])\s+(.+)$/;
const CORRECT_RE = /\s*(?:\*|\[x\]|\(corect\)|\(correct\))\s*$/i;

interface ParsedOption {
  text: string;
  correct: boolean;
}

function splitBlocks(raw: string): string[] {
  return raw
    .replace(/\r\n/g, "\n")
    // an explicit `---` rule is a hard separator
    .split(/\n[ \t]*-{3,}[ \t]*\n/)
    // within each, blank lines separate blocks too
    .flatMap((chunk) => chunk.split(/\n[ \t]*\n+/))
    .map((b) => b.trim())
    .filter(Boolean);
}

function parseBlock(block: string, file: string): Question | null {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
  if (lines.length === 0) return null;

  let prompt = "";
  const options: ParsedOption[] = [];

  for (const line of lines) {
    const optMatch = line.match(OPTION_RE);
    const qMatch = line.match(QUESTION_RE);

    if (options.length === 0 && qMatch && !optMatch) {
      prompt = prompt ? `${prompt} ${qMatch[1]}` : qMatch[1];
    } else if (optMatch) {
      let text = optMatch[1].trim();
      const correct = CORRECT_RE.test(text);
      if (correct) text = text.replace(CORRECT_RE, "").trim();
      options.push({ text, correct });
    } else if (options.length === 0) {
      // free-form prompt line without a `Q:` prefix
      prompt = prompt ? `${prompt} ${line}` : line;
    } else {
      throw new Error(
        `[${file}] unexpected line after options in block:\n${block}`,
      );
    }
  }

  if (!prompt) {
    throw new Error(`[${file}] block is missing a question:\n${block}`);
  }
  if (options.length !== 2) {
    throw new Error(
      `[${file}] expected exactly 2 options but got ${options.length} in block:\n${block}`,
    );
  }
  const correctCount = options.filter((o) => o.correct).length;
  if (correctCount !== 1) {
    throw new Error(
      `[${file}] expected exactly 1 correct answer (marked with *) but got ${correctCount} in block:\n${block}`,
    );
  }

  const texts: [string, string] = [options[0].text, options[1].text];
  const correctIndex: 0 | 1 = options[0].correct ? 0 : 1;
  return { id: hashId(prompt, texts), prompt, options: texts, correctIndex, source: file };
}

export class NativeTextParser implements QuestionParser {
  readonly extensions = [".txt", ".md"];

  parse(raw: string, file: string): Question[] {
    return splitBlocks(raw)
      .map((block) => parseBlock(block, file))
      .filter((q): q is Question => q !== null);
  }
}

export const nativeTextParser = new NativeTextParser();
