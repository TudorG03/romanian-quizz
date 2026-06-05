"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { REACTION_MS, useGame } from "@/game/store";
import { StartScreen } from "./StartScreen";
import { PlayScreen } from "./PlayScreen";
import { EndScreen } from "./EndScreen";

// The 3D stage is client-only (WebGL); never server-render it.
const GameCanvas = dynamic(() => import("./GameCanvas").then((m) => m.GameCanvas), {
  ssr: false,
});

/**
 * Drives the reaction → advance timing: once the dancer enters a reaction
 * phase (celebrate/fall), schedule the crossfade back to dancing and the move
 * to the next question. Kept here (not in the store) so the timer is tied to
 * the component lifecycle and cleaned up on unmount/restart.
 */
function useReactionDirector() {
  const dancerPhase = useGame((s) => s.dancerPhase);
  const advance = useGame((s) => s.advance);

  useEffect(() => {
    if (dancerPhase === "dancing") return;
    const timer = setTimeout(advance, REACTION_MS);
    return () => clearTimeout(timer);
  }, [dancerPhase, advance]);
}

export function Game() {
  useReactionDirector();
  const screen = useGame((s) => s.screen);

  return (
    <main className="touch-arena relative h-full w-full overflow-hidden">
      {/* 3D stage behind everything */}
      <div className="absolute inset-0 z-0">
        <GameCanvas />
      </div>

      {/* UI overlay */}
      <div className="relative z-10 h-full w-full">
        {screen === "start" && <StartScreen />}
        {screen === "playing" && <PlayScreen />}
        {screen === "end" && <EndScreen />}
      </div>
    </main>
  );
}
