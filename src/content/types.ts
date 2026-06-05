/**
 * Universal question model used across the whole app.
 *
 * Every supported source format (plain text, JSON, .docx, ...) is normalised
 * into this shape by a {@link QuestionParser}. The game only ever deals with
 * `Question`, never with raw file formats.
 */
export interface Question {
  /** Stable, content-derived id (used as React key and for de-duplication). */
  id: string;
  /** The question text shown to the player. */
  prompt: string;
  /** Exactly two answers — the game is a binary left/right swipe. */
  options: [string, string];
  /** Index (0 = left, 1 = right) of the correct answer. */
  correctIndex: 0 | 1;
  /** Originating file name, kept for diagnostics. */
  source?: string;
}

/**
 * Strategy interface: one implementation per text-based source format.
 *
 * Implementations must be pure and isomorphic (no Node/browser-only APIs) so
 * they can run both in the build-time pipeline and in unit tests. Binary
 * formats (e.g. .docx) are converted to text upstream, then handed to the
 * matching text parser.
 */
export interface QuestionParser {
  /** Lowercase file extensions (with leading dot) this parser handles. */
  readonly extensions: string[];
  /**
   * Parse raw file text into questions.
   * @param raw  Full text content of the file.
   * @param file Basename of the source file (for error messages).
   * @throws if a block is malformed, so the build fails loudly.
   */
  parse(raw: string, file: string): Question[];
}
