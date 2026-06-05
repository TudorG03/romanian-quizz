"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/game/store";

const COUNT = 96;
const ROWS = 6;
const PALETTE = ["#ff2d95", "#20e3ff", "#b14bff", "#b6ff3a", "#ffb020"];

interface Member {
  x: number;
  z: number;
  phase: number;
  speed: number;
  scale: number;
}

// The crowd layout is randomised once at module load (stable across renders).
const MEMBERS: Member[] = (() => {
  const perRow = Math.ceil(COUNT / ROWS);
  return Array.from({ length: COUNT }, (_, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    return {
      x: (col - perRow / 2) * 1.05 + (Math.random() - 0.5) * 0.4,
      z: -5.5 - row * 1.3 - Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
      speed: 1.6 + Math.random() * 1.3,
      scale: 0.42 + Math.random() * 0.22,
    };
  });
})();

/**
 * Stylized, fully instanced crowd of glowing capsule silhouettes behind the
 * dancer. They bob to the beat continuously; on a correct answer they jump
 * (cheer), on a wrong answer they slump (boo). Unlit + bloom = neon glow, and
 * a single InstancedMesh keeps it cheap on mobile.
 */
export function Crowd() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Per-instance neon colour (set once).
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const color = new THREE.Color();
    MEMBERS.forEach((_, i) => {
      color.set(PALETTE[i % PALETTE.length]);
      m.setColorAt(i, color);
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);

  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = state.clock.elapsedTime;
    const phase = useGame.getState().dancerPhase;
    const cheer = phase === "celebrating";
    const boo = phase === "falling";

    for (let i = 0; i < COUNT; i++) {
      const member = MEMBERS[i];
      const amp = cheer ? 0.5 : boo ? 0.04 : 0.18;
      const speed = cheer ? member.speed * 2.1 : member.speed;
      let y = Math.abs(Math.sin(t * speed + member.phase)) * amp;
      if (boo) y = -0.1; // slump down

      // capsule pivot is centered, so lift by half-height * scale to sit on floor
      dummy.position.set(member.x, y + member.scale * 0.95, member.z);
      dummy.scale.setScalar(member.scale);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <capsuleGeometry args={[0.22, 0.5, 4, 8]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
