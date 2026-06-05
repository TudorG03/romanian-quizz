"use client";

import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useGame, type DancerPhase } from "@/game/store";

const MODEL_URL = "/models/RobotExpressive.glb";
const FADE = 0.3;

/** Clips (verified present in the GLB) used for each game phase. */
const CELEBRATIONS = ["Jump", "ThumbsUp", "Wave", "Yes"] as const;

function clipFor(phase: DancerPhase): { name: string; once: boolean } {
  if (phase === "falling") return { name: "Death", once: true };
  if (phase === "celebrating") {
    const name = CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
    return { name, once: true };
  }
  return { name: "Dance", once: false };
}

/**
 * The dancer. Loads RobotExpressive once and crossfades between clips driven by
 * `dancerPhase`: loops `Dance`, plays a one-shot celebration on a correct
 * answer, and `Death` (fall to the ground) on a wrong one — then smoothly
 * fades back to `Dance`.
 */
export function Dancer() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, group);
  const phase = useGame((s) => s.dancerPhase);
  const currentName = useRef<string | null>(null);

  // Enable shadow casting on every mesh of the model.
  useLayoutEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  useEffect(() => {
    if (!actions) return;
    const { name, once } = clipFor(phase);
    const next = actions[name];
    if (!next) return;

    const prev = currentName.current ? actions[currentName.current] : null;

    next.reset();
    next.enabled = true;
    next.setEffectiveWeight(1);
    if (once) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.clampWhenFinished = false;
    }
    next.fadeIn(FADE).play();
    if (prev && prev !== next) prev.fadeOut(FADE);
    currentName.current = name;
  }, [phase, actions]);

  return (
    <group ref={group} position={[0, 0, 0]} scale={0.62}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
