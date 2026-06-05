"use client";

import { BATCH_SIZES, useGame, type BatchSize } from "@/game/store";

export function StartScreen() {
  const start = useGame((s) => s.start);
  const poolSize = useGame((s) => s.poolSize);
  const highScore = useGame((s) => s.highScore);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-neon-cyan">
        Proba de limba română
      </p>
      <h1 className="bg-gradient-to-br from-neon-pink via-neon-violet to-neon-cyan bg-clip-text text-5xl font-black leading-tight text-transparent drop-shadow-[0_0_25px_rgba(255,45,149,0.35)] sm:text-6xl">
        Dansul Bacului
      </h1>
      <p className="mt-4 max-w-xs text-balance text-base text-white/70">
        Dansatorul se mișcă pe scenă. Tu citești întrebarea și alegi prin{" "}
        <span className="text-neon-pink">swipe</span> sau cu săgețile{" "}
        <span className="text-white">← →</span>. Răspuns corect — dans victorios. Greșit — cade
        la podea.
      </p>

      <div className="mt-10 w-full max-w-xs">
        <p className="mb-3 text-sm uppercase tracking-widest text-white/50">Câte întrebări?</p>
        <div className="grid grid-cols-3 gap-3">
          {BATCH_SIZES.map((size) => (
            <BatchButton key={size} size={size} onStart={start} />
          ))}
        </div>
        <p className="mt-3 text-xs text-white/40">{poolSize} întrebări disponibile în total</p>
      </div>

      {highScore > 0 && (
        <p className="mt-8 text-sm text-neon-lime">
          Record sesiune: <span className="font-bold">{highScore}</span>
        </p>
      )}
    </div>
  );
}

function BatchButton({
  size,
  onStart,
}: {
  size: BatchSize;
  onStart: (size: BatchSize) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onStart(size)}
      className="group rounded-2xl border border-white/15 bg-white/5 py-5 text-2xl font-bold text-white transition hover:scale-105 hover:border-neon-pink hover:bg-neon-pink/15 hover:text-neon-pink active:scale-95"
    >
      {size}
    </button>
  );
}
