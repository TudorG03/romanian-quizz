import type { Question, QuestionParser } from "../types";
import { hashId } from "../hash";

/**
 * Parser for `.json` question banks. Tolerant of a few common shapes:
 *
 *   [ { "prompt": "...", "options": ["a", "b"], "correctIndex": 0 } ]
 *   { "questions": [ { "question": "...", "answers": ["a", "b"], "correct": "a" } ] }
 *
 *  - prompt key:  `prompt` | `question`
 *  - options key: `options` | `answers`  (exactly two)
 *  - correct key: `correctIndex` | `correct` — a 0/1 index, an "A"/"B" letter,
 *    or the exact text of the correct option.
 */

interface RawItem {
  prompt?: unknown;
  question?: unknown;
  options?: unknown;
  answers?: unknown;
  correctIndex?: unknown;
  correct?: unknown;
}

function resolveCorrectIndex(value: unknown, options: [string, string], file: string): 0 | 1 {
  if (value === 0 || value === 1) return value;
  if (typeof value === "string") {
    const v = value.trim();
    if (v.toUpperCase() === "A") return 0;
    if (v.toUpperCase() === "B") return 1;
    const byText = options.findIndex((o) => o === v);
    if (byText === 0 || byText === 1) return byText;
  }
  throw new Error(
    `[${file}] cannot resolve correct answer from ${JSON.stringify(value)} for options ${JSON.stringify(options)}`,
  );
}

export class JsonParser implements QuestionParser {
  readonly extensions = [".json"];

  parse(raw: string, file: string): Question[] {
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      throw new Error(`[${file}] invalid JSON: ${(err as Error).message}`);
    }

    const items: unknown = Array.isArray(data)
      ? data
      : (data as { questions?: unknown })?.questions;
    if (!Array.isArray(items)) {
      throw new Error(`[${file}] expected an array of questions or { "questions": [...] }`);
    }

    return items.map((entry, i) => {
      const item = entry as RawItem;
      const prompt = (item.prompt ?? item.question) as unknown;
      const rawOptions = (item.options ?? item.answers) as unknown;

      if (typeof prompt !== "string" || prompt.trim() === "") {
        throw new Error(`[${file}] item ${i}: missing string "prompt"/"question"`);
      }
      if (!Array.isArray(rawOptions) || rawOptions.length !== 2) {
        throw new Error(`[${file}] item ${i}: "options"/"answers" must be an array of exactly 2`);
      }
      const options: [string, string] = [String(rawOptions[0]), String(rawOptions[1])];
      const correctIndex = resolveCorrectIndex(item.correctIndex ?? item.correct, options, file);

      return {
        id: hashId(prompt.trim(), options),
        prompt: prompt.trim(),
        options,
        correctIndex,
        source: file,
      };
    });
  }
}

export const jsonParser = new JsonParser();
