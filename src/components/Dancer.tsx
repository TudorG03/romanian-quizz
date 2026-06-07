"use client";

/*
 * The AnimationActions returned by `useAnimations` are driven imperatively
 * (reset / fadeIn / play / setLoop) — that is three.js's intended API for an
 * animation state machine, so we opt out of react-hooks/immutability here.
 */
/* eslint-disable react-hooks/immutability */

import { useFBX, useAnimations } from "@react-three/drei";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useGame, type DancerPhase } from "@/game/store";

/**
 * The dancer is a Mixamo-sourced human, delivered as three single-clip FBX
 * files that all share the same skeleton. We render the mesh from the dance
 * file and retarget the cheer/fall clips onto it by name.
 */
const FBX = {
  dance: "/models/dance.fbx", // Macarena — default looping state
  cheer: "/models/cheer.fbx", // correct answer
  fall: "/models/fall.fbx", // wrong answer
} as const;

const FADE = 0.3;
/** Scale the model so it stands this many world units tall (feet on y = 0). */
const TARGET_HEIGHT = 2.2;

/** Clip names we assign to the merged animations, one per game phase. */
const CLIPS = { dance: "Dance", fall: "Fall", cheer: "Cheer" } as const;

function clipFor(phase: DancerPhase): { name: string; once: boolean } {
  if (phase === "falling") return { name: CLIPS.fall, once: true };
  if (phase === "celebrating") return { name: CLIPS.cheer, once: true };
  return { name: CLIPS.dance, once: false };
}

/** First animation clip of an FBX group, cloned and renamed (or null). */
function clipFrom(group: THREE.Group, name: string): THREE.AnimationClip | null {
  const clip = group.animations[0]?.clone();
  if (!clip) return null;
  clip.name = name;
  return clip;
}

/**
 * The dancer. Loads the three Mixamo FBX clips once, renders the dance mesh and
 * crossfades between clips driven by `dancerPhase`: loops `Dance`, plays a
 * one-shot `Cheer` on a correct answer, and `Fall` (collapse to the ground) on
 * a wrong one — then smoothly fades back to `Dance`.
 */
export function Dancer() {
  const group = useRef<THREE.Group>(null);
  const danceFbx = useFBX(FBX.dance);
  const cheerFbx = useFBX(FBX.cheer);
  const fallFbx = useFBX(FBX.fall);
  const phase = useGame((s) => s.dancerPhase);
  const currentName = useRef<string | null>(null);

  // Merge the single clip from each FBX into one named set on the dance rig.
  const clips = useMemo(
    () =>
      [
        clipFrom(danceFbx, CLIPS.dance),
        clipFrom(cheerFbx, CLIPS.cheer),
        clipFrom(fallFbx, CLIPS.fall),
      ].filter((c): c is THREE.AnimationClip => c !== null),
    [danceFbx, cheerFbx, fallFbx],
  );

  const { actions } = useAnimations(clips, group);

  // Auto-fit: scale to TARGET_HEIGHT, centre on x/z, drop feet to y = 0, and
  // enable shadows. Done from the measured bounding box because Mixamo FBX
  // exports at an arbitrary unit scale.
  useLayoutEffect(() => {
    const g = group.current;
    if (!g) return;
    g.scale.setScalar(1);
    g.position.set(0, 0, 0);
    g.updateWorldMatrix(true, true);

    const box = new THREE.Box3().setFromObject(danceFbx);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const s = TARGET_HEIGHT / (size.y || 1);
    g.scale.setScalar(s);
    g.position.set(-center.x * s, -box.min.y * s, -center.z * s);

    danceFbx.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [danceFbx]);

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
    <group ref={group}>
      <primitive object={danceFbx} />
    </group>
  );
}

useFBX.preload(FBX.dance);
useFBX.preload(FBX.cheer);
useFBX.preload(FBX.fall);
