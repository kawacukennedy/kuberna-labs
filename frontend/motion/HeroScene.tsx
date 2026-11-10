import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Hero3D } from "./Hero3D";
import { ShaderField } from "./ShaderField";
import { BRAND, easeOut } from "./theme";

export type HeroSceneProps = {
  headline?: string;
  eyebrow?: string;
  spin?: number;
};

const Word: React.FC<{ children: string; index: number }> = ({ children, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = 0.25 * fps + index * 0.09 * fps;

  return (
    <span
      style={{
        display: "inline-block",
        // Motion is driven by the frame, not CSS transitions.
        opacity: interpolate(frame, [delay, delay + 0.6 * fps], [0, 1], {
          ...easeOut,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: interpolate(
          frame,
          [delay, delay + 0.7 * fps],
          ["0px 38px", "0px 0px"],
          { ...easeOut, easing: Easing.bezier(0.16, 1, 0.3, 1) },
        ),
        filter: `blur(${interpolate(frame, [delay, delay + 0.6 * fps], [10, 0], easeOut)}px)`,
      }}
    >
      {children}
    </span>
  );
};

export const HeroScene: React.FC<HeroSceneProps> = ({
  headline = "Architect the Agentic Web3 Enterprise",
  eyebrow = "Agentic Computing Environment",
  spin = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const words = headline.split(" ");

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.ink }}>
      <ShaderField intensity={0.72} />

      <AbsoluteFill
        style={{
          // The 3D core sits on the right, biased by a slow parallax drift.
          translate: interpolate(
            frame,
            [0, durationInFrames],
            ["0px 0px", "-70px 18px"],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          justifyContent: "center",
          alignItems: "center",
          paddingLeft: "34%",
        }}
      >
        <Hero3D spin={spin} />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          padding: "0 8%",
          justifyContent: "center",
          alignItems: "flex-start",
          color: "#ffffff",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        }}
      >
        <div style={{ maxWidth: 820 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 22px",
              borderRadius: 9999,
              border: "1px solid rgba(129, 140, 248, 0.35)",
              backgroundColor: "rgba(70, 72, 212, 0.18)",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], easeOut),
              scale: interpolate(frame, [0, 0.7 * fps], [0.94, 1], {
                ...easeOut,
                output: "perceptual-scale",
              }),
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 9999,
                backgroundColor: BRAND.emeraldLight,
                opacity: interpolate(
                  frame % (2 * fps),
                  [0, fps, 2 * fps],
                  [1, 0.35, 1],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                ),
              }}
            />
            {eyebrow}
          </div>

          <h1
            style={{
              margin: "34px 0 26px",
              fontSize: 92,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
              fontWeight: 700,
              display: "flex",
              flexWrap: "wrap",
              gap: "0 22px",
            }}
          >
            {words.map((word, index) => (
              <Word key={`${word}-${index}`} index={index}>
                {word}
              </Word>
            ))}
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: 26,
              lineHeight: 1.5,
              color: "rgba(248, 249, 255, 0.72)",
              maxWidth: 620,
              opacity: interpolate(frame, [1.1 * fps, 1.9 * fps], [0, 1], easeOut),
              translate: interpolate(
                frame,
                [1.1 * fps, 2 * fps],
                ["0px 24px", "0px 0px"],
                { ...easeOut, easing: Easing.bezier(0.16, 1, 0.3, 1) },
              ),
            }}
          >
            Build, deploy, and monetize autonomous AI agents on decentralized
            infrastructure.
          </p>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
