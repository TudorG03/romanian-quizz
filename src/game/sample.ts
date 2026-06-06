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

/**
 * Randomly decide which side (left = 0, right = 1) the correct answer appears on,
 * by 50/50 swapping the two options. Authored banks tend to always put the correct
 * answer first, which would make the swipe trivial — this keeps it a real choice.
 * Returns a new object; the `id` (React key / dedupe key) is intentionally kept.
 */
export function withRandomSides(q: Question): Question {
  if (Math.random() < 0.5) return q;
  return {
    ...q,
    options: [q.options[1], q.options[0]],
    correctIndex: q.correctIndex === 0 ? 1 : 0,
  };
}
