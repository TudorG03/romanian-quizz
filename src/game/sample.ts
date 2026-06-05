import type { Question } from "@/content/types";

/**
 * Return a random batch of `count` questions, unbiased (Fisher–Yates shuffle).
 * Never mutates the input; if the pool is smaller than `count`, returns the
 * whole shuffled pool.
 */
export function sampleQuestions(pool: readonly Question[], count: number): Question[] {
  const arr = pool.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
}
