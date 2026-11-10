import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, easeOut } from "./theme";

export type Hero3DProps = {
  /** Overall rotation speed multiplier. */
  spin?: number;
};

/**
 * The Kuberna "agentic core": a wireframe icosahedron shell around a glowing
 * core, with orbit rings and satellites.
 *
 * Every transform below is a pure function of `useCurrentFrame()` — no
 * `useFrame()`, no shader clocks — so frames are reproducible when rendering.
 */
const Scene: React.FC<{ spin: number }> = ({ spin }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const seconds = frame / fps;

  const shellRotationY = seconds * 0.34 * spin;
  const shellRotationX = Math.sin(seconds * 0.42) * 0.24;
  const ringRotation = seconds * 0.6 * spin;

  const dolly = interpolate(frame, [0, 3 * fps], [0.82, 1], { ...easeOut });
  const lift = interpolate(frame, [0, 3 * fps], [0.35, 0], { ...easeOut });

  const satellites = [0, 1, 2, 3, 4, 5];

  return (
    <group scale={dolly} position={[0, lift, 0]}>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 6]} intensity={2.1} color="#ffffff" />
      <pointLight position={[-4, -3, 3]} intensity={26} color={BRAND.emeraldLight} />
      <pointLight position={[3, 4, -2]} intensity={18} color={BRAND.indigoLight} />

      {/* Wireframe containment shell */}
      <mesh rotation={[shellRotationX, shellRotationY, 0]}>
        <icosahedronGeometry args={[1.62, 1]} />
        <meshBasicMaterial color={BRAND.indigoLight} wireframe transparent opacity={0.42} />
      </mesh>

      {/* Glowing core */}
      <mesh scale={1 + Math.sin(seconds * 1.8) * 0.035}>
        <icosahedronGeometry args={[0.72, 3]} />
        <meshStandardMaterial
          color={BRAND.indigo}
          emissive={BRAND.emeraldLight}
          emissiveIntensity={0.55}
          metalness={0.85}
          roughness={0.18}
        />
      </mesh>

      {/* Orbit rings */}
      <mesh rotation={[Math.PI / 2.35, ringRotation, 0.32]}>
        <torusGeometry args={[2.28, 0.008, 12, 180]} />
        <meshBasicMaterial color={BRAND.indigoLight} transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[Math.PI / 1.75, -ringRotation * 1.3, -0.45]}>
        <torusGeometry args={[2.72, 0.006, 12, 200]} />
        <meshBasicMaterial color={BRAND.emeraldLight} transparent opacity={0.45} />
      </mesh>

      {/* Satellites on individual orbits */}
      {satellites.map((index) => {
        const orbit = 1.95 + (index % 3) * 0.34;
        const speed = 0.28 + index * 0.045;
        const angle = seconds * speed * spin + (index * Math.PI * 2) / satellites.length;
        const tilt = (index % 2 === 0 ? 1 : -1) * (0.35 + index * 0.06);

        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * orbit, Math.sin(angle) * tilt, Math.sin(angle) * orbit]}
            rotation={[seconds * 0.9, seconds * 0.7, 0]}
            scale={0.1 + (index % 3) * 0.035}
          >
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={index % 3 === 0 ? BRAND.amber : BRAND.emeraldLight}
              emissive={index % 3 === 0 ? BRAND.amber : BRAND.emeraldLight}
              emissiveIntensity={0.6}
              metalness={0.6}
              roughness={0.3}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export const Hero3D: React.FC<Hero3DProps> = ({ spin = 1 }) => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ fov: 42, position: [0, 0, 6.4] }}
        gl={{ antialias: true, alpha: true }}
        style={{ backgroundColor: "transparent" }}
      >
        <Scene spin={spin} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
