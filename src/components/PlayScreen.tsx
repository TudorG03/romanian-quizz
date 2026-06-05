"use client";

import { useGame } from "@/game/store";
import { Hud } from "./Hud";
import { QuestionCard } from "./QuestionCard";

export function PlayScreen() {
  const locked = useGame((s) => s.locked);
  const lastCorrect = useGame((s) => s.lastCorrect);

  return (
    <div className="flex h-full w-full flex-col">
      <Hud />
      <div className="relative flex-1">
        <QuestionCard />
        {locked && lastCorrect !== null && <FeedbackBanner correct={lastCorrect} />}
      </div>
    </div>
  );
}

function FeedbackBanner({ correct }: { correct: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className={`[animation:var(--animate-pop)] text-5xl font-black drop-shadow-[0_0_25px_rgba(0,0,0,0.6)] ${
          correct ? "text-neon-lime" : "text-neon-pink"
        }`}
      >
        {correct ? "Corect! +1" : "Greșit!"}
      </span>
    </div>
  );
}
