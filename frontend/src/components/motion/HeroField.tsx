import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useMotionTier } from "./capabilities";
import { MotionBoundary } from "./MotionBoundary";
import { StaticAurora } from "./StaticAurora";
import { StaticCore } from "./StaticCore";

const HeroFieldStage = dynamic(() => import("./HeroFieldStage"), { ssr: false });

/**
 * Homepage hero motion.
 *
 * Three layers, cheapest first: the CSS aurora (always, in the server markup),
 * the SVG core on large screens (always), and the live shader and three.js core
 * only on a device that measured as capable. The live layer mounts over the
 * stand-ins and fades its own replacement in when it is actually drawing, so
 * this never shows an empty half-hero: not while hydrating, not on a machine
 * with WebGL disabled, and not if the lazy chunk fails to load.
 */
export const HeroField: React.FC = () => {
  const tier = useMotionTier();
  const [coreLive, setCoreLive] = useState(false);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
      <StaticAurora className="absolute inset-0" />

      <div
        className="motion-hero-stage absolute inset-y-0 right-0 hidden w-[54%] items-center justify-center lg:flex"
        data-core-state={coreLive ? "live" : "static"}
      >
        <div className="aspect-square w-full max-w-[620px]">
          <StaticCore />
        </div>
      </div>

      {tier === "full" ? (
        <MotionBoundary>
          <HeroFieldStage onCoreLive={setCoreLive} />
        </MotionBoundary>
      ) : null}
    </div>
  );
};

export default HeroField;
