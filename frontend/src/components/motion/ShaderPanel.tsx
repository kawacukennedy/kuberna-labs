import React from "react";
import dynamic from "next/dynamic";
import { useMotionTier } from "./capabilities";
import { MotionBoundary } from "./MotionBoundary";
import { StaticAurora } from "./StaticAurora";

const ShaderStage = dynamic(() => import("./ShaderStage"), { ssr: false });

type ShaderPanelProps = {
  tone?: "dark" | "light";
  className?: string;
  children?: React.ReactNode;
};

/**
 * A framed shader surface for content sections.
 *
 * The CSS aurora is the panel as far as most visitors are concerned; the live
 * shader is an upgrade applied only on the `full` motion tier, and it sits
 * behind an error boundary so a decorative chunk can never blank the section.
 */
export const ShaderPanel: React.FC<ShaderPanelProps> = ({ tone = "dark", className, children }) => {
  const tier = useMotionTier();

  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      {/* The dark surface lives here, not in the aurora, so the layer keeps its
          contrast whether the bands are drawn by CSS or by the shader. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            tone === "dark"
              ? "radial-gradient(120% 100% at 20% 10%, #312e81 0%, #121c2a 55%, #0b1220 100%)"
              : "none",
        }}
      />
      <StaticAurora tone={tone} className="absolute inset-0" />
      {tier === "full" ? (
        <div aria-hidden className="absolute inset-0">
          <MotionBoundary>
            <ShaderStage tone={tone} intensity={tone === "dark" ? 1 : 0.9} />
          </MotionBoundary>
        </div>
      ) : null}
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};

export default ShaderPanel;
