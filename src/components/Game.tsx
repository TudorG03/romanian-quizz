"use client";

import { useEffect } from "react";
import { REACTION_MS, useGame } from "@/game/store";
import { StartScreen } from "./StartScreen";
import { PlayScreen } from "./PlayScreen";
import { EndScreen } from "./EndScreen";

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
      {/* The 3D stage (added next) sits behind this overlay. */}
      <div className="relative z-10 h-full w-full">
        {screen === "start" && <StartScreen />}
        {screen === "playing" && <PlayScreen />}
        {screen === "end" && <EndScreen />}
      </div>
    </main>
  );
}
