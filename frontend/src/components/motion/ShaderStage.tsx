import React from "react";
import { AnimatedShaderSurface } from "../../../motion/ShaderSurface";

type ShaderStageProps = {
  tone?: "light" | "dark";
  intensity?: number;
  className?: string;
};

/**
 * The animated shader as the site mounts it.
 *
 * This used to be a Remotion `<Player>`, which cost an 82 kB gzip chunk, logged
 * a licence nag, warned that `ref` is not a prop, and created an AudioContext
 * it was never allowed to start (three warnings per mount, plus one on every
 * hot reload). None of that was doing any work: the player existed only to give
 * the canvas a clock, and a canvas can own its own clock.
 *
 * Only ever loaded inside the `full` motion tier, and only through a lazy
 * import, so no shader code reaches a device that cannot run it. Keep this
 * module free of anything but the surface: it is a chunk, not a component the
 * page should import directly.
 */
export default function ShaderStage({
  tone = "light",
  intensity = 1,
  className,
}: ShaderStageProps) {
  return <AnimatedShaderSurface tone={tone} intensity={intensity} className={className} />;
}
