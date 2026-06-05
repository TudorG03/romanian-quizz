"use client";

import { Grid } from "@react-three/drei";

/**
 * The neon concert stage: dark reflective floor with a glowing grid, two
 * coloured key spotlights aimed at the dancer, fog for depth, and a violet
 * back light. Designed to read well under the bloom pass.
 */
export function Stage() {
  return (
    <>
      <color attach="background" args={["#07060f"]} />
      <fog attach="fog" args={["#07060f", 9, 24]} />

      <ambientLight intensity={0.55} color="#6a5aa8" />
      <hemisphereLight intensity={0.4} color="#b14bff" groundColor="#07060f" />

      {/* Coloured key lights */}
      <spotLight
        position={[-6, 8, 4]}
        angle={0.6}
        penumbra={0.9}
        intensity={400}
        distance={40}
        color="#ff2d95"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
      />
      <spotLight
        position={[6, 8, 4]}
        angle={0.6}
        penumbra={0.9}
        intensity={400}
        distance={40}
        color="#20e3ff"
      />
      {/* Rim / back glow */}
      <pointLight position={[0, 3.5, -5]} intensity={120} color="#b14bff" distance={25} />

      {/* Solid floor (catches shadows) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0a0816" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* Glowing dance-floor grid */}
      <Grid
        position={[0, 0.012, 0]}
        infiniteGrid
        cellSize={0.6}
        cellThickness={1}
        cellColor="#3a2d66"
        sectionSize={3}
        sectionThickness={1.5}
        sectionColor="#ff2d95"
        fadeDistance={26}
        fadeStrength={1.4}
      />
    </>
  );
}
