"use client";

import { useEffect, useRef, useState } from "react";
import { selectCurrentQuestion, useGame } from "@/game/store";

const DRAG_START = 8; // px of movement before a press becomes a swipe
const SWIPE_THRESHOLD = 90; // px to commit a choice

/**
 * The question prompt plus the two answer panels (option 0 = left, 1 = right).
 *
 * Controls (all equivalent):
 *  - swipe / drag anywhere in the play area left or right,
 *  - tap an answer panel,
 *  - press ← / →.
 *
 * The whole arena is the swipe surface: a press that moves past DRAG_START
 * becomes a swipe (the prompt card follows and the target option leans in),
 * while a press that doesn't move stays a tap so the option buttons still work.
 */
export function QuestionCard() {
  const question = useGame(selectCurrentQuestion);
  const answer = useGame((s) => s.answer);
  const locked = useGame((s) => s.locked);
  const lastChoice = useGame((s) => s.lastChoice);

  const arenaRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragXRef = useRef(0);
  const startX = useRef(0);
  const pointerId = useRef<number | null>(null);
  const active = useRef(false);
  const moved = useRef(false);

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

  const onPointerDown = (e: React.PointerEvent) => {
    if (locked || e.button !== 0) return;
    active.current = true;
    moved.current = false;
    startX.current = e.clientX;
    pointerId.current = e.pointerId;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!active.current) return;
    const dx = e.clientX - startX.current;
    if (!moved.current) {
      // Stay a tap until the finger/mouse actually travels.
      if (Math.abs(dx) < DRAG_START) return;
      moved.current = true;
      setDragging(true);
      arenaRef.current?.setPointerCapture(e.pointerId);
    }
    dragXRef.current = dx;
    setDragX(dx);
  };

  const endDrag = () => {
    if (!active.current) return;
    active.current = false;
    const wasDrag = moved.current;
    moved.current = false;
    setDragging(false);
    const dx = dragXRef.current;
    dragXRef.current = 0;
    setDragX(0);
    if (pointerId.current !== null) {
      arenaRef.current?.releasePointerCapture(pointerId.current);
      pointerId.current = null;
    }
    if (!wasDrag) return; // a tap — let the option button's onClick handle it
    if (dx <= -SWIPE_THRESHOLD) answer(0);
    else if (dx >= SWIPE_THRESHOLD) answer(1);
  };

  // How strongly the drag leans toward each side (for the preview highlight).
  const lean: -1 | 0 | 1 =
    dragX <= -SWIPE_THRESHOLD / 2 ? -1 : dragX >= SWIPE_THRESHOLD / 2 ? 1 : 0;
  const tilt = Math.max(-14, Math.min(14, dragX * 0.05));

  return (
    <div
      ref={arenaRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="touch-none flex h-full w-full cursor-grab select-none flex-col items-center justify-between px-4 pb-6 pt-2 active:cursor-grabbing"
    >
      {/* Prompt card follows the drag */}
      <div
        key={question.id}
        style={{
          transform: `translateX(${dragX}px) rotate(${tilt}deg)`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.22,1.4,0.4,1)",
        }}
        className="mt-2 w-full max-w-md rounded-3xl border border-white/10 bg-black/35 px-5 py-6 text-center shadow-2xl backdrop-blur-md [animation:var(--animate-fade)]"
      >
        <p className="mb-2 text-[0.65rem] uppercase tracking-[0.3em] text-neon-cyan">
          Glisează ← sau →
        </p>
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
          leaning={lean === -1}
          onPick={() => answer(0)}
        />
        <OptionPanel
          side="right"
          text={question.options[1]}
          state={panelState(1, question.correctIndex, locked, lastChoice)}
          leaning={lean === 1}
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
  leaning,
  onPick,
}: {
  side: "left" | "right";
  text: string;
  state: PanelState;
  leaning: boolean;
  onPick: () => void;
}) {
  const leanClass =
    leaning && state === "idle" ? "border-neon-pink bg-neon-pink/20 scale-[1.03]" : "";
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={state !== "idle"}
      aria-label={`Răspuns ${side === "left" ? "stânga" : "dreapta"}: ${text}`}
      className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-3xl border px-3 py-4 text-center font-semibold text-white transition active:scale-95 disabled:cursor-default ${STATE_CLASSES[state]} ${leanClass}`}
    >
      <span aria-hidden className="text-xs text-white/40">
        {side === "left" ? "← stânga" : "dreapta →"}
      </span>
      <span className="text-balance leading-tight">{text}</span>
    </button>
  );
}
