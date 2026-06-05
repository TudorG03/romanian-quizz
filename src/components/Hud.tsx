"use client";

import { useGame } from "@/game/store";

export function Hud() {
  const score = useGame((s) => s.score);
  const highScore = useGame((s) => s.highScore);
  const index = useGame((s) => s.index);
  const total = useGame((s) => s.batch.length);

  return (
    <div className="pointer-events-none flex items-start justify-between px-5 pt-5">
      <Stat label="Scor" value={score} accent="text-neon-pink" />
      <div className="rounded-full bg-black/30 px-4 py-1.5 text-sm font-medium text-white/70 backdrop-blur-sm">
        {Math.min(index + 1, total)} / {total}
      </div>
      <Stat label="Record" value={highScore} accent="text-neon-lime" align="right" />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  align = "left",
}: {
  label: string;
  value: number;
  accent: string;
  align?: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <p className="text-[0.65rem] uppercase tracking-widest text-white/45">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}
