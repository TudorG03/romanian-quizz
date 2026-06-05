"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Stage } from "./Stage";
import { Dancer } from "./Dancer";
import { Crowd } from "./Crowd";
import { Confetti } from "./Confetti";

/**
 * The always-on 3D background: neon stage, dancer, reactive crowd and confetti,
 * with a bloom pass for the neon glow. Rendered behind the UI overlay. DPR is
 * capped so it stays smooth on phones.
 */
export function GameCanvas() {
  return (
    <Canvas
      className="absolute inset-0"
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 1.7, 6.2], fov: 42 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <Stage />
        <Dancer />
        <Crowd />
        <Confetti />
      </Suspense>
      <EffectComposer>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
