"use client";

import { useEffect } from "react";
import { selectCurrentQuestion, useGame } from "@/game/store";

/**
 * The question prompt plus the two answer panels (option 0 = left, 1 = right).
 * Controls: tap a panel, or use the ← / → arrow keys. (Swipe gestures are
 * layered on in a later step.) While a reaction is playing the panels reveal
 * the correct/incorrect colours.
 */
export function QuestionCard() {
  const question = useGame(selectCurrentQuestion);
  const answer = useGame((s) => s.answer);
  const locked = useGame((s) => s.locked);
  const lastChoice = useGame((s) => s.lastChoice);

  // Keyboard parity with swiping.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") answer(0);
      else if (e.key === "ArrowRight") answer(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer]);

  if (!question) return null;

  return (
    <div className="flex h-full w-full flex-col items-center justify-between px-4 pb-6 pt-2">
      {/* Prompt */}
      <div
        key={question.id}
        className="mt-2 w-full max-w-md rounded-3xl border border-white/10 bg-black/35 px-5 py-6 text-center shadow-2xl backdrop-blur-md [animation:var(--animate-rise)]"
      >
        <p className="mb-2 text-[0.65rem] uppercase tracking-[0.3em] text-neon-cyan">Întrebare</p>
        <p className="text-balance text-xl font-semibold leading-snug text-white">
          {question.prompt}
        </p>
      </div>

      {/* Options */}
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        <OptionPanel
          side="left"
          text={question.options[0]}
          state={panelState(0, question.correctIndex, locked, lastChoice)}
          onPick={() => answer(0)}
        />
        <OptionPanel
          side="right"
          text={question.options[1]}
          state={panelState(1, question.correctIndex, locked, lastChoice)}
          onPick={() => answer(1)}
        />
      </div>
    </div>
  );
}

type PanelState = "idle" | "correct" | "wrong" | "dimmed";

function panelState(
  index: 0 | 1,
  correctIndex: 0 | 1,
  locked: boolean,
  lastChoice: 0 | 1 | null,
): PanelState {
  if (!locked) return "idle";
  if (index === correctIndex) return "correct";
  if (index === lastChoice) return "wrong";
  return "dimmed";
}

const STATE_CLASSES: Record<PanelState, string> = {
  idle: "border-white/15 bg-white/5 hover:border-neon-pink hover:bg-neon-pink/15",
  correct: "border-neon-lime bg-neon-lime/20 text-neon-lime shadow-[0_0_25px_rgba(182,255,58,0.4)]",
  wrong: "border-neon-pink bg-neon-pink/20 text-neon-pink",
  dimmed: "border-white/10 bg-white/5 opacity-40",
};

function OptionPanel({
  side,
  text,
  state,
  onPick,
}: {
  side: "left" | "right";
  text: string;
  state: PanelState;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={state !== "idle"}
      aria-label={`Răspuns ${side === "left" ? "stânga" : "dreapta"}: ${text}`}
      className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border px-3 py-4 text-center font-semibold text-white transition active:scale-95 disabled:cursor-default ${STATE_CLASSES[state]}`}
    >
      <span aria-hidden className="text-xs text-white/40">
        {side === "left" ? "← stânga" : "dreapta →"}
      </span>
      <span className="text-balance leading-tight">{text}</span>
    </button>
  );
}
