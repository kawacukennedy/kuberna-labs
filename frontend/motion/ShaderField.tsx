import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ShaderSurface } from "./ShaderSurface";

/**
 * Immersive aurora field.
 *
 * The whole image is produced by a single fragment shader whose only time
 * source is `frame / fps`, so every frame is deterministic and renders
 * identically in Studio, in a video render, and on the live site.
 *
 * The shader itself lives in `ShaderSurface` and knows nothing about Remotion:
 * the live site mounts that module directly, so no page has to download the
 * player to show an animated background.
 */

export type ShaderFieldProps = {
  intensity?: number;
  /** `dark` for cinematic renders, `light` for the light-theme site. */
  tone?: "dark" | "light";
};

export const ShaderField: React.FC<ShaderFieldProps> = ({ intensity = 1, tone = "dark" }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <ShaderSurface
        time={frame / fps}
        width={width}
        height={height}
        tone={tone}
        intensity={intensity}
      />
    </AbsoluteFill>
  );
};
