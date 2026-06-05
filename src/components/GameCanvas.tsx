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
      camera={{ position: [0, 1.6, 9.5], fov: 38 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ camera }) => camera.lookAt(0, 1.35, 0)}
    >
      <Suspense fallback={null}>
        <Stage />
        <Dancer />
        <Crowd />
        <Confetti />
      </Suspense>
      <EffectComposer>
        <Bloom
          intensity={0.7}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
