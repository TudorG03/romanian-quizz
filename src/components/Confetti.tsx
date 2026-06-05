"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGame } from "@/game/store";

const COUNT = 140;
const LIFETIME = 1.8;
const GRAVITY = 9.5;
const ORIGIN = new THREE.Vector3(0, 2.2, 0);
const PALETTE = ["#ff2d95", "#20e3ff", "#b14bff", "#b6ff3a", "#ffb020", "#ffffff"];

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  spin: number;
  life: number; // remaining seconds; <= 0 means inactive
}

/**
 * A pooled confetti burst that fires from above the dancer whenever the player
 * answers correctly (dancerPhase transitions into "celebrating"). Instanced,
 * unlit, gravity-driven, and recycled — no allocations per frame.
 */
// Mutable particle pool, created once at module load and recycled in place.
const POOL: Particle[] = Array.from({ length: COUNT }, () => ({
  pos: new THREE.Vector3(),
  vel: new THREE.Vector3(),
  spin: 0,
  life: 0,
}));

export function Confetti() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Random fixed colours for the pool.
  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const color = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      color.set(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
      m.setColorAt(i, color);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);

  // Fire the burst on the dancing -> celebrating transition.
  useEffect(() => {
    let prev = useGame.getState().dancerPhase;
    const unsub = useGame.subscribe((s) => {
      if (s.dancerPhase !== prev) {
        if (s.dancerPhase === "celebrating") burst(POOL);
        prev = s.dancerPhase;
      }
    });
    return unsub;
  }, []);

  useFrame((_, delta) => {
    const m = mesh.current;
    if (!m) return;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      const p = POOL[i];
      if (p.life > 0) {
        p.life -= dt;
        p.vel.y -= GRAVITY * dt;
        p.pos.addScaledVector(p.vel, dt);
        const s = Math.max(0, Math.min(1, p.life)) * 0.09;
        dummy.position.copy(p.pos);
        dummy.rotation.set(p.spin * p.life, p.spin * p.life * 1.3, p.spin * p.life);
        dummy.scale.setScalar(s);
      } else {
        dummy.scale.setScalar(0);
      }
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} transparent />
    </instancedMesh>
  );
}

function burst(particles: Particle[]) {
  for (const p of particles) {
    p.pos.copy(ORIGIN);
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    p.vel.set(
      Math.cos(angle) * speed * 0.6,
      3 + Math.random() * 4,
      Math.sin(angle) * speed * 0.6,
    );
    p.spin = (Math.random() - 0.5) * 12;
    p.life = LIFETIME * (0.7 + Math.random() * 0.6);
  }
}
