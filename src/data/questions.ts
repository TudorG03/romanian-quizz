import type { Question } from "@/content/types";
import generated from "./questions.generated.json";

/**
 * The full question bank, generated at build time from /content by
 * scripts/build-questions.ts (run via predev/prebuild). On a fresh checkout
 * the JSON is created before `next dev`/`next build`, so this import is always
 * resolved against freshly parsed content.
 */
export const QUESTIONS = generated as Question[];
