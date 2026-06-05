"use client";

import { useGame } from "@/game/store";

function verdict(score: number, total: number): { title: string; sub: string } {
  const ratio = total === 0 ? 0 : score / total;
  if (ratio === 1) return { title: "Perfect!", sub: "Ai dat toate răspunsurile corect. Dansează!" };
  if (ratio >= 0.7) return { title: "Bravo!", sub: "Un rezultat foarte bun." };
  if (ratio >= 0.4) return { title: "Nu-i rău!", sub: "Mai exersează puțin." };
  return { title: "Mai încearcă", sub: "Bacul se ia cu repetiție." };
}

export function EndScreen() {
  const score = useGame((s) => s.score);
  const total = useGame((s) => s.batch.length);
  const highScore = useGame((s) => s.highScore);
  const restart = useGame((s) => s.restart);

  const { title, sub } = verdict(score, total);
  const isRecord = score > 0 && score >= highScore;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-neon-cyan">Final</p>
      <h2 className="mt-2 bg-gradient-to-br from-neon-lime to-neon-cyan bg-clip-text text-5xl font-black text-transparent">
        {title}
      </h2>
      <p className="mt-3 text-white/70">{sub}</p>

      <div className="mt-8 flex items-end gap-2 text-white">
        <span className="text-7xl font-black tabular-nums text-neon-pink drop-shadow-[0_0_20px_rgba(255,45,149,0.4)]">
          {score}
        </span>
        <span className="mb-2 text-2xl text-white/50">/ {total}</span>
      </div>

      <p className="mt-4 text-sm text-neon-lime">
        {isRecord ? "🏆 Record nou de sesiune!" : `Record sesiune: ${highScore}`}
      </p>

      <button
        type="button"
        onClick={restart}
        className="mt-10 rounded-full bg-gradient-to-r from-neon-pink to-neon-violet px-10 py-4 text-lg font-bold text-white shadow-[0_0_30px_rgba(177,75,255,0.5)] transition hover:scale-105 active:scale-95"
      >
        Joacă din nou
      </button>
    </div>
  );
}
