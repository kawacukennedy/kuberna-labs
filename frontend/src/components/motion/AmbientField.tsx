import React from "react";
import dynamic from "next/dynamic";

const AmbientFieldStage = dynamic(() => import("./AmbientFieldStage"), { ssr: false });

/**
 * Immersive light-wash that runs above page backgrounds on every route.
 *
 * It is an additive overlay rather than a background because individual pages
 * paint their own opaque sections; blending on top means the motion reads on
 * all of them without rewriting each page's surface colors.
 */
export const AmbientField: React.FC = () => {
  return (
    <div
      aria-hidden
      className="motion-ambient pointer-events-none fixed inset-0 z-[5] overflow-hidden"
      style={{
        mixBlendMode: "soft-light",
        opacity: 0.6,
        maskImage: "linear-gradient(to bottom, #000 0%, #000 42%, transparent 78%)",
        WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 42%, transparent 78%)",
      }}
    >
      <AmbientFieldStage />
    </div>
  );
};
