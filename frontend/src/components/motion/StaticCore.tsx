import React from "react";
import { BRAND } from "../../../motion/theme";

/**
 * The agentic core as SVG.
 *
 * Drawn to match `AgentCore3D`: a wireframe containment shell, a lit indigo
 * sphere, an emerald halo, two orbit rings and a handful of satellites. It is
 * the fallback for machines where WebGL is unavailable or where the renderer
 * failed after detection, so the right half of the hero is never an empty box.
 *
 * Everything here is vector and CSS: a handful of paths, one slow rotation and
 * one pulse, all on the compositor.
 */
export const StaticCore: React.FC = () => {
  return (
    <div aria-hidden className="motion-static-core relative h-full w-full">
      <svg
        viewBox="0 0 620 620"
        className="h-full w-full"
        role="presentation"
        focusable="false"
      >
        <defs>
          <radialGradient id="kuberna-core-body" cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor="#8b93ff" />
            <stop offset="38%" stopColor={BRAND.indigo} />
            <stop offset="100%" stopColor="#241f6b" />
          </radialGradient>
          <radialGradient id="kuberna-core-halo" cx="50%" cy="50%" r="50%">
            <stop offset="45%" stopColor={BRAND.emeraldLight} stopOpacity="0.32" />
            <stop offset="100%" stopColor={BRAND.emeraldLight} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="kuberna-core-sheen" cx="30%" cy="24%" r="46%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Halo, then the sphere it sits behind. */}
        <circle cx="310" cy="300" r="215" fill="url(#kuberna-core-halo)" />
        <g className="motion-static-core__pulse">
          <circle cx="310" cy="304" r="104" fill="url(#kuberna-core-body)" />
          <circle cx="310" cy="304" r="104" fill="url(#kuberna-core-sheen)" />
          {/* A few surface facets so the sphere reads as a 3D body. */}
          <path
            d="M232 262 Q310 232 388 262 M222 314 Q310 292 398 314 M236 362 Q310 348 384 362"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.16"
            strokeWidth="2"
          />
        </g>

        {/* Wireframe containment shell. */}
        <g
          className="motion-static-core__spin"
          fill="none"
          stroke={BRAND.indigoLight}
          strokeOpacity="0.62"
          strokeWidth="1.6"
        >
          <polygon points="310,116 398,168 448,258 428,352 350,404 258,392 196,326 190,232 240,158" />
          <polygon points="310,116 448,258 350,404 190,232" strokeOpacity="0.4" />
          <polygon points="398,168 428,352 258,392 190,232 240,158" strokeOpacity="0.4" />
          <line x1="310" y1="116" x2="310" y2="404" strokeOpacity="0.24" />
          <line x1="190" y1="232" x2="448" y2="258" strokeOpacity="0.24" />
        </g>

        {/* Orbit rings. */}
        <g
          className="motion-static-core__ring motion-static-core__ring--outer"
          fill="none"
          stroke={BRAND.emeraldLight}
          strokeOpacity="0.5"
          strokeWidth="1.4"
        >
          <ellipse cx="310" cy="300" rx="290" ry="96" transform="rotate(-18 310 300)" />
        </g>
        <g
          className="motion-static-core__ring motion-static-core__ring--inner"
          fill="none"
          stroke={BRAND.indigoLight}
          strokeOpacity="0.55"
          strokeWidth="1.4"
        >
          <ellipse cx="310" cy="300" rx="252" ry="120" transform="rotate(26 310 300)" />
          <circle cx="86" cy="366" r="7" fill={BRAND.amber} stroke="none" />
          <circle cx="524" cy="246" r="5.5" fill={BRAND.indigoLight} stroke="none" />
          <circle cx="452" cy="128" r="4.5" fill={BRAND.indigoLight} stroke="none" />
        </g>
      </svg>
    </div>
  );
};

export default StaticCore;
