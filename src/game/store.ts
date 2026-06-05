import { create } from "zustand";
import type { Question } from "@/content/types";
import { QUESTIONS } from "@/data/questions";
import { sampleQuestions } from "./sample";

export type Screen = "start" | "playing" | "end";

/** Dancer animation state, driven purely by the game flow. */
export type DancerPhase = "dancing" | "celebrating" | "falling";

export const BATCH_SIZES = [10, 15, 20] as const;
export type BatchSize = (typeof BATCH_SIZES)[number];

/**
 * How long the dancer performs a reaction (celebrate / fall) before the game
 * crossfades back to dancing and advances to the next question. The 3D clips
 * and the UI feedback are tuned to this window.
 */
export const REACTION_MS = 2000;

interface GameState {
  screen: Screen;
  /** The sampled questions for the current run. */
  batch: Question[];
  /** Index of the current question within `batch`. */
  index: number;
  score: number;
  /** Best score across runs this session (resets on full page reload). */
  highScore: number;
  dancerPhase: DancerPhase;
  /** Result of the most recent answer, for crowd/UI feedback. */
  lastCorrect: boolean | null;
  /** Which option the player picked most recently (for card feedback). */
  lastChoice: 0 | 1 | null;
  /** True while a reaction is playing — blocks further input. */
  locked: boolean;
  /** Size of the question bank (for start-screen messaging). */
  poolSize: number;

  /** Begin a new run with a freshly sampled batch of `size` questions. */
  start: (size: BatchSize) => void;
  /** Record the player's choice (0 = left, 1 = right) for the current question. */
  answer: (choice: 0 | 1) => void;
  /** Advance to the next question, or end the run if the batch is exhausted. */
  advance: () => void;
  /** Return to the start screen, keeping the session high score. */
  restart: () => void;
}

export const useGame = create<GameState>((set, get) => ({
  screen: "start",
  batch: [],
  index: 0,
  score: 0,
  highScore: 0,
  dancerPhase: "dancing",
  lastCorrect: null,
  lastChoice: null,
  locked: false,
  poolSize: QUESTIONS.length,

  start: (size) =>
    set({
      screen: "playing",
      batch: sampleQuestions(QUESTIONS, size),
      index: 0,
      score: 0,
      dancerPhase: "dancing",
      lastCorrect: null,
      lastChoice: null,
      locked: false,
    }),

  answer: (choice) => {
    const { screen, locked, batch, index, score, highScore } = get();
    if (screen !== "playing" || locked) return;
    const question = batch[index];
    if (!question) return;

    const correct = choice === question.correctIndex;
    const nextScore = correct ? score + 1 : score;
    set({
      locked: true,
      lastCorrect: correct,
      lastChoice: choice,
      score: nextScore,
      highScore: Math.max(highScore, nextScore),
      dancerPhase: correct ? "celebrating" : "falling",
    });
  },

  advance: () => {
    const { screen, batch, index } = get();
    if (screen !== "playing") return;
    const next = index + 1;
    if (next >= batch.length) {
      set({ screen: "end", dancerPhase: "dancing", locked: false, lastCorrect: null, lastChoice: null });
    } else {
      set({ index: next, dancerPhase: "dancing", locked: false, lastCorrect: null, lastChoice: null });
    }
  },

  restart: () =>
    set({
      screen: "start",
      batch: [],
      index: 0,
      score: 0,
      dancerPhase: "dancing",
      lastCorrect: null,
      lastChoice: null,
      locked: false,
    }),
}));

/** Selector: the question currently in play, if any. */
export const selectCurrentQuestion = (s: GameState): Question | undefined => s.batch[s.index];
