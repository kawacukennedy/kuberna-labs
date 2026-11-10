import React from "react";
import dynamic from "next/dynamic";
import { useMotionTier } from "./capabilities";
import { MotionBoundary } from "./MotionBoundary";

const ShaderStage = dynamic(() => import("./ShaderStage"), { ssr: false });

/**
 * Immersive light-wash that runs above page backgrounds on every route.
 *
 * It is an additive overlay rather than a background because individual pages
 * paint their own opaque sections; blending on top means the motion reads on
 * all of them without rewriting each page's surface colours.
 *
 * This is the most expensive layer on the site — a full-viewport fragment
 * shader on every route — so it is the first thing dropped: phones, low-power
 * machines and reduced-motion visitors never request it.
 */
export const AmbientField: React.FC = () => {
  const tier = useMotionTier();

  if (tier !== "full") {
    return null;
  }

  return (
    <div
      aria-hidden
      className="motion-ambient pointer-events-none fixed inset-0 z-[5] overflow-hidden"
      style={{
        mixBlendMode: "soft-light",
        opacity: 0.45,
        maskImage: "linear-gradient(to bottom, #000 0%, #000 34%, transparent 72%)",
        WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 34%, transparent 72%)",
      }}
    >
      <MotionBoundary>
        <ShaderStage tone="light" />
      </MotionBoundary>
    </div>
  );
};
