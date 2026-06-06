import type { Question, QuestionParser } from "../types";
import { hashId } from "../hash";

/**
 * Parser for the lettered multiple-choice format used by the BAC question bank
 * (authored in Word and dropped in as `.docx`, which the build script extracts to
 * plain text via mammoth before handing it here).
 *
 * Format — numbered questions, lettered options, the correct one tagged `(C)`:
 *
 *   Luceafărul                                   ← topic header (ignored)
 *
 *   1. Artă poetică aparținând lui Mihai Eminescu
 *   A. Luceafărul (C)
 *   B. Testament
 *
 *   2. În ce an este publicat poemul Luceafărul?
 *   A. 1883 (C)
 *   B. 1914
 *
 * Rules:
 *  - A question line starts with a number: `1.` / `12)`.
 *  - An option line starts with a letter: `A.` / `B)` (case-insensitive).
 *  - The correct option is flagged by a trailing `(C)` (also stripped from the text).
 *  - Any other non-empty line is treated as a topic header / section break and
 *    ignored — questions from every topic are mixed together downstream.
 *  - mammoth puts a blank line between every paragraph, so blank lines are NOT
 *    block separators here; the next numbered line starts the next question.
 *  - Exactly two options, exactly one correct — anything else throws (loud build).
 */

const QUESTION_RE = /^\d+[.)]\s+(.+)$/;
const OPTION_RE = /^[A-Da-d][.)]\s+(.+)$/;
const CORRECT_RE = /\s*\(\s*[Cc]\s*\)\s*$/;

interface Accumulator {
  prompt: string;
  options: { text: string; correct: boolean }[];
}

function flush(current: Accumulator | null, file: string, out: Question[]): void {
  if (!current) return;
  const { prompt, options } = current;
  const context = `${prompt}\n${options.map((o) => o.text).join("\n")}`;

  if (options.length !== 2) {
    throw new Error(
      `[${file}] expected exactly 2 options but got ${options.length} for question:\n${context}`,
    );
  }
  const correctCount = options.filter((o) => o.correct).length;
  if (correctCount !== 1) {
    throw new Error(
      `[${file}] expected exactly 1 correct answer (marked with "(C)") but got ${correctCount} for question:\n${context}`,
    );
  }

  const texts: [string, string] = [options[0].text, options[1].text];
  const correctIndex: 0 | 1 = options[0].correct ? 0 : 1;
  out.push({ id: hashId(prompt, texts), prompt, options: texts, correctIndex, source: file });
}

export class LetteredMcqParser implements QuestionParser {
  readonly extensions = [".docx"];

  parse(raw: string, file: string): Question[] {
    const lines = raw
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const out: Question[] = [];
    let current: Accumulator | null = null;

    for (const line of lines) {
      const qMatch = line.match(QUESTION_RE);
      if (qMatch) {
        flush(current, file, out);
        current = { prompt: qMatch[1].trim(), options: [] };
        continue;
      }

      const optMatch = line.match(OPTION_RE);
      if (optMatch) {
        if (!current) {
          throw new Error(`[${file}] option found before any question:\n${line}`);
        }
        let text = optMatch[1].trim();
        const correct = CORRECT_RE.test(text);
        if (correct) text = text.replace(CORRECT_RE, "").trim();
        current.options.push({ text, correct });
        continue;
      }

      // A topic header or section break: finish the question in progress and skip.
      flush(current, file, out);
      current = null;
    }

    flush(current, file, out);
    return out;
  }
}

export const letteredMcqParser = new LetteredMcqParser();
