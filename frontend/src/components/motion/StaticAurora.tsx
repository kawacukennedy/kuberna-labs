import React from "react";

type StaticAuroraProps = {
  tone?: "light" | "dark";
  className?: string;
};

/**
 * The aurora as CSS.
 *
 * This is the rendition that every visitor sees first, and the only one that
 * low-power devices, phones, reduced-motion visitors and machines without WebGL
 * ever see. It is deliberately built from gradient stacks whose soft stops do
 * the work of a blur — no `filter`, no canvas, no layout reads — and it animates
 * only `transform`, so it stays on the compositor and costs nothing on the main
 * thread. On an old phone it is indistinguishable from a still image in terms of
 * CPU load, but still breathes.
 */
export const StaticAurora: React.FC<StaticAuroraProps> = ({ tone = "light", className }) => {
  return (
    <div
      aria-hidden
      className={`motion-aurora motion-aurora--${tone} ${className ?? ""}`}
    >
      <span className="motion-aurora__band motion-aurora__band--indigo" />
      <span className="motion-aurora__band motion-aurora__band--emerald" />
      <span className="motion-aurora__band motion-aurora__band--amber" />
      <span className="motion-aurora__glow motion-aurora__glow--indigo" />
      <span className="motion-aurora__glow motion-aurora__glow--emerald" />
    </div>
  );
};

export default StaticAurora;
